import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService){}

    @Post()
    async createUser(@Body() dto: CreateUserDto){
        return await this.userService.createUser(dto);
    }

    @Get()
    async findAllUsers(
        @Query('page', new ValidationPipe({ transform: true })) page?: number,
        @Query('limit', new ValidationPipe({ transform: true })) limit?: number
    ){
        return await this.userService.findAll({
            skip: page && limit ? (page - 1) * limit : 0,
            take: limit || 10,
        });
    }

    @Get(':id')
    async findUserById(@Param('id', ParseIntPipe) id: number){
        return await this.userService.findOne(id);
    }

    @Patch(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto
    ){
        return await this.userService.update(id, dto);
    }

    @Delete(':id')
    async deleteUser(@Param('id', ParseIntPipe) id: number){
        return await this.userService.remove(id);
    }
}
