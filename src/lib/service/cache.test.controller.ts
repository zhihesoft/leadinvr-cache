import { Controller, Delete, Get, Query } from "@nestjs/common";
import { HttpCache, RevokeHttpCache } from "./cached.decorator";

@Controller("cache")
export class CacheTestController {
    @HttpCache("testCache:{query.name}", 10)
    @Get("get-test")
    getTest(@Query("name") name: string): string {
        return "Cache Test Endpoint";
    }

    @RevokeHttpCache("testCache:*")
    @Delete("delete-test")
    deleteTest(): string {
        return "Cache Test Endpoint";
    }
}
