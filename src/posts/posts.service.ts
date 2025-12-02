import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: number) {
    const { tags, ...postData } = createPostDto;

    return this.prisma.post.create({
      data: {
        ...postData,
        authorId,
        tags: tags
          ? {
              create: tags.map((tag) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tag },
                    create: { name: tag },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        tags: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  async findAll(query: QueryPostDto) {
    const { page = 1, limit = 10, search, published, authorId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      ...(published !== undefined && { published }),
      ...(authorId && { authorId: parseInt(authorId) }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          tags: true,
          _count: {
            select: { comments: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, bio: true },
        },
        tags: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    const { tags, ...postData } = updatePostDto;

    try {
      return await this.prisma.post.update({
        where: { id },
        data: {
          ...postData,
          tags: tags
            ? {
                set: [], // Supprime tous les tags existants
                create: tags.map((tag) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: tag },
                      create: { name: tag },
                    },
                  },
                })),
              }
            : undefined,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
          tags: true,
          _count: {
            select: { comments: true },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Post with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.post.delete({
        where: { id },
      });
      return { message: `Post ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Post with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  // Méthodes supplémentaires utiles
  async findByAuthor(authorId: number) {
    return this.prisma.post.findMany({
      where: { authorId },
      include: {
        tags: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }
}
