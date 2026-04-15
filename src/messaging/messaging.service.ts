import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {

  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    const message = this.messageRepo.create({
      senderId,
      receiverId: dto.receiverId,
      content: dto.content,
    });
    return this.messageRepo.save(message);
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(senderId: string, receiverId: string) {
    await this.messageRepo.update(
      { senderId, receiverId, isRead: false },
      { isRead: true },
    );
  }
}