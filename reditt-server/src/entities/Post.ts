import { Field, Int, ObjectType} from "type-graphql";
import { BaseEntity, Column, CreateDateColumn,Entity ,ManyToOne,OneToMany,PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Field()
  @Column({ type: "text" })
  title!: string;

  @Field(() => Int,{nullable : true})
  voteStatus : number | undefined;

  @Field()
  @Column({ type: "text" })
  text!: string;

  @Field()
  @Column({ type: "int",default : 0 })
  points!: number;

  @Field()
  @Column()
  creatorId! : number;

  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator!: User;

  @OneToMany(() => Updoot, updoot => updoot.post)
  updoots!: Updoot[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt! : Date;
  
  @Field(() => String) 
  @UpdateDateColumn()
  updatedAt! : Date ;
}
