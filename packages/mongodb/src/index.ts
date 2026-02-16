import { Asset } from './models/asset.models.js';
import { AssetVariant } from './models/assetVariants.models.js';
import { Comment } from './models/comments.model.js';
import { Notification } from './models/notifications.models.js';
import { Tag } from './models/tags.models.js';
import type {
  IAsset,
  IAssetVariant,
  IComment,
  INotification,
  ITag,
} from './interfaces/index.interface.js';
import { connectMongoDB, disconnectMongoDB } from './connection.js';

export {
  Asset,
  AssetVariant,
  Comment,
  Notification,
  Tag,
  IAsset,
  IAssetVariant,
  IComment,
  INotification,
  ITag,
  connectMongoDB,
  disconnectMongoDB,
};
