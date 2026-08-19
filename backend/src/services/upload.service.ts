import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { ApiError } from '../utils/ApiError.js';

const hasCloudinary = !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

const UPLOADS_DIR = join(process.cwd(), 'uploads');

async function storeFile(buffer: Buffer, folder: string, originalName: string, mimeType: string): Promise<{ url: string }> {
  if (hasCloudinary) {
    const resourceType = folder === 'avatars' ? 'image' : 'raw';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `collabspace/${folder}`, resource_type: resourceType },
        (error, result) => {
          if (error) reject(new ApiError(500, 'Upload failed: ' + error.message));
          else resolve({ url: result!.secure_url });
        }
      );
      stream.end(buffer);
    });
  }

  const ext = originalName.split('.').pop() || 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const dir = join(UPLOADS_DIR, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), buffer);
  return { url: `/uploads/${folder}/${filename}` };
}

export const uploadService = {
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const result = await storeFile(file.buffer, 'avatars', file.originalname, file.mimetype);

    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: result.url },
      { new: true }
    );
    if (!user) throw new ApiError(404, 'User not found');

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role === 'USER' ? 'MEMBER' : user.role,
    };
  },

  async uploadDocumentFile(userId: string, file: Express.Multer.File) {
    const result = await storeFile(file.buffer, 'documents', file.originalname, file.mimetype);

    // Determine document type from mimetype
    let type: 'pdf' | 'docx' | 'markdown' = 'pdf';
    if (file.mimetype.includes('word')) type = 'docx';
    else if (file.mimetype.includes('markdown') || file.mimetype === 'text/plain') type = 'markdown';

    // Create a document record for the uploaded file
    const title = file.originalname.replace(/\.[^/.]+$/, '');
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const doc = await Document.create({
      title,
      type,
      owner: userId,
      content: [{ id: `blk_${Date.now()}`, type: 'paragraph', content: `Uploaded file: ${file.originalname}` }],
      collaborators: [{ user: userId, role: 'OWNER' }],
      fileUrl: result.url,
    });

    return {
      id: doc._id.toString(),
      title: doc.title,
      type: doc.type,
      fileUrl: result.url,
      createdAt: doc.createdAt.toISOString(),
    };
  },
};
