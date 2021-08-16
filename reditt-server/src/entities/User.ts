import { Field, ObjectType } from "type-graphql";
import { Column, PrimaryGeneratedColumn ,CreateDateColumn, UpdateDateColumn, Entity, BaseEntity, OneToMany } from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Field()
  @Column({ unique : true })
  username!: string;

  @Field()
  @Column({ unique : true })
  email!: string;
  
  @Column()
  password!: string;
  
  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date ;

  @OneToMany(() => Post, post => post.creator)
  posts!: Post[];

  @OneToMany(() => Updoot, updoot => updoot.user)
  updoots!: Updoot[];

  
  @Field(() => String) 
  @UpdateDateColumn()
  updatedAt!: Date ;
}
