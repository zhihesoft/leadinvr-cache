# cache

cache module for nestjs

<p align="center">
  <a href="https://www.npmjs.com/package/@leadinvr/cache">
    <img src="https://img.shields.io/npm/v/@leadinvr/cache.svg?style=for-the-badge" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@leadinvr/cache">
    <img src="https://img.shields.io/npm/dt/@leadinvr/cache.svg?style=for-the-badge" alt="npm total downloads" />
  </a>
  <a href="https://www.npmjs.com/package/@leadinvr/cache">
    <img src="https://img.shields.io/npm/dm/@leadinvr/cache.svg?style=for-the-badge" alt="npm monthly downloads" />
  </a>
  <a href="https://www.npmjs.com/package/@leadinvr/cache">
    <img src="https://img.shields.io/npm/l/@leadinvr/cache.svg?style=for-the-badge" alt="npm license" />
  </a>
</p>


# Quick Start

## Register

```ts
CacheModule.register(
    {
        uri: "redis://localhost",
        workspace: "demo",
    },
    /* is global register */
    true,
);
```

## Async register

```ts
CacheModule.registerAsync({
    global: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configs: ConfigService) => ({
        uri: configs.get("REDIS_URL"),
        workspace: "demo",
    }),
});
```
