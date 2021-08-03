import {Resolver, Query } from "type-graphql";

@Resolver()
export class HelloResolver{
    @Query(() => String)
    Hello(){
        return 'hello';
    }
}