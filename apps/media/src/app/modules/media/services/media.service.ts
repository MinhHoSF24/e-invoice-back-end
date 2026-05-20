import { UploadFileTcpReq } from '@common/interfaces/tcp/media';
import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/services/cloudinary.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(params: UploadFileTcpReq) {
    return await this.cloudinaryService.uploadFile(Buffer.from(params.fileBase64, 'base64'), params.fileName);
  }
}
