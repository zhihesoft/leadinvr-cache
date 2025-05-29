import { Controller, Delete, Get } from "@nestjs/common";
import { HttpCache, RevokeHttpCache } from "./cached.decorator";

@Controller("cache")
export class CacheTestController {
    @HttpCache("testCache", "60s")
    @Get("get-test")
    getTest(): string {
        return "Cache Test Endpoint";
    }

    @RevokeHttpCache("testCache")
    @Delete("delete-test")
    deleteTest(): string {
        return "Cache Test Endpoint";
    }
}
