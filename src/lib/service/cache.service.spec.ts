import "reflect-metadata";

import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { CacheModule } from "../cache.module";
import { CacheService } from "./cache.service";
import { CacheTestController } from "./cache.test.controller";

describe("CacheModule", () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let svc: CacheService;
    const redisUri = "redis://127.0.0.1:6379";

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                CacheModule.register({
                    isGlobal: true,
                    redisUri: redisUri,
                    workspace: "cache-test",
                }),
            ],
            controllers: [CacheTestController],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
        svc = moduleRef.get(CacheService);
    });

    afterAll(async () => {
        await moduleRef.close();
        svc = null as any; // Clear the service reference
    });
    // let catsService = { findAll: () => ['test'] };
    // redis://127.0.0.1:6379

    it("register", async () => {
        expect(svc).toBeDefined();
    });

    it("set key", async () => {
        await svc.set("test", { name: "test" }, 60);
        const data: { name: string } | undefined = await svc.get("test");
        expect(data).toBeDefined();
        expect(data!.name).toBe("test");
    });

    it("get key", async () => {
        await svc.set("test2", { name: "test2" }, 0.5);
        const data: { name: string } | undefined = await svc.get("test2");
        expect(data).toBeDefined();
        expect(data!.name).toBe("test2");
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1 seconds
        const data2: { name: string } | undefined = await svc.get("test2");
        expect(data2).toBeUndefined();
    });

    it("cache decorators", async () => {
        let resp = await request(app.getHttpServer()).get("/cache/get-test");
        expect(resp.status).toBe(200);
        expect(resp.text).toBe("Cache Test Endpoint");
        let cachedData = await svc.get("testCache");
        expect(cachedData).toBe("Cache Test Endpoint");

        resp = await request(app.getHttpServer()).delete("/cache/delete-test");
        expect(resp.status).toBe(200);
        expect(resp.text).toBe("Cache Test Endpoint");
        cachedData = await svc.get("testCache");
        expect(cachedData).toBeUndefined();
    });
});
