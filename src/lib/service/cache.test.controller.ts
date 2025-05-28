import { Controller, Delete, Get } from "@nestjs/common";
import { Cached, RevokeCache } from "./cached.decorator";

@Controller("cache")
export class CacheTestController {
    @Cached("testCache", "60s")
    @Get("get-test")
    getTest(): string {
        return "Cache Test Endpoint";
    }

    @RevokeCache("testCache")
    @Delete("delete-test")
    deleteTest(): string {
        return "Cache Test Endpoint";
    }
}
