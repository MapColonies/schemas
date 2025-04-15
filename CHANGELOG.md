# Changelog

## [1.6.0](https://github.com/MapColonies/schemas/compare/v1.5.0...v1.6.0) (2025-04-14)


### Features

* created retiler schema ([#63](https://github.com/MapColonies/schemas/issues/63)) ([67a8a25](https://github.com/MapColonies/schemas/commit/67a8a25e3e63360c30641fb38ce4086833eec438))

## [1.5.0](https://github.com/MapColonies/schemas/compare/v1.4.0...v1.5.0) (2025-04-14)


### Features

* add vector common schema ([#67](https://github.com/MapColonies/schemas/issues/67)) ([f01879f](https://github.com/MapColonies/schemas/commit/f01879ff668aa3a335b1eb51cf7d8cf3bb469143))
* allow unevaluated properties for DB and S3 schemas ([#84](https://github.com/MapColonies/schemas/issues/84)) ([d3aea81](https://github.com/MapColonies/schemas/commit/d3aea81fc173def1988781d2bf94103f43f98523))
* extend validator keywords to include 'x-env-format' ([#82](https://github.com/MapColonies/schemas/issues/82)) ([a313911](https://github.com/MapColonies/schemas/commit/a3139112c0ae07101adce9b0c89f77361b97245a))

## [1.4.0](https://github.com/MapColonies/schemas/compare/v1.3.0...v1.4.0) (2025-03-18)


### Features

* new schemes for LookupTalbles data ([#74](https://github.com/MapColonies/schemas/issues/74)) ([17227e7](https://github.com/MapColonies/schemas/commit/17227e71ea3f6a7505df04f040d50582f82e8b7c))


### Dependency Updates

* downgraded typescript ([#68](https://github.com/MapColonies/schemas/issues/68)) ([53a1e3c](https://github.com/MapColonies/schemas/commit/53a1e3c05c6c6608793958a05678fc6eb17bddc2))

## [1.3.0](https://github.com/MapColonies/schemas/compare/v1.2.0...v1.3.0) (2025-01-29)


### Features

* added default configs ([#56](https://github.com/MapColonies/schemas/issues/56)) ([aacd20f](https://github.com/MapColonies/schemas/commit/aacd20fb5b04ab865e8379ba2d747601c0956bdb))
* added opala default configs ([#58](https://github.com/MapColonies/schemas/issues/58)) ([878cd62](https://github.com/MapColonies/schemas/commit/878cd62246a032ef4bf4452fc7d8d69a3231b3fd))

## [1.2.0](https://github.com/MapColonies/schemas/compare/v1.1.0...v1.2.0) (2025-01-14)


### Features

* add schema with metrics to boilerplate ([#50](https://github.com/MapColonies/schemas/issues/50)) ([16eab1a](https://github.com/MapColonies/schemas/commit/16eab1a2950ab285e5904ccb04fae6b37f684daf))
* default configs ([#48](https://github.com/MapColonies/schemas/issues/48)) ([5dce479](https://github.com/MapColonies/schemas/commit/5dce479bcdaaf4bf1c0aef5cc3b31d65485c0b5e))

## [1.1.0](https://github.com/MapColonies/schemas/compare/v1.0.1...v1.1.0) (2024-11-18)


### Features

* adding x-env-value attributes too all db's properties ([#45](https://github.com/MapColonies/schemas/issues/45)) ([6fc4e84](https://github.com/MapColonies/schemas/commit/6fc4e84de65e8b73c04eda615bb37c32eed5018c))
* implementing schemas for opa-la packages ([#44](https://github.com/MapColonies/schemas/issues/44)) ([c343218](https://github.com/MapColonies/schemas/commit/c3432180fe75ef7015ababe367aedfe6c4d4e84c))

## [1.0.1](https://github.com/MapColonies/schemas/compare/v1.0.0...v1.0.1) (2024-10-04)


### Bug Fixes

* bad default is now validated ([3038734](https://github.com/MapColonies/schemas/commit/30387340183f360bf0e5980feea239a6e19bd914))

## [1.0.0](https://github.com/MapColonies/schemas/compare/v0.2.1...v1.0.0) (2024-09-25)


### ⚠ BREAKING CHANGES

* set every latest version as only version ([#42](https://github.com/MapColonies/schemas/issues/42))

### Features

* add boilerplate schema ([137e6c5](https://github.com/MapColonies/schemas/commit/137e6c5f39f35f9ba1147fee3e2e1e40794a7621))
* add description to partial schema ([5df7d0c](https://github.com/MapColonies/schemas/commit/5df7d0c2f9ae5d24c17ed58aee4c98b8e66edbc8))
* add job manager schema ([4bae35e](https://github.com/MapColonies/schemas/commit/4bae35e22d0cd78e386c2d1916b2f29f019db692))
* add number validation ([9c969b6](https://github.com/MapColonies/schemas/commit/9c969b6b47ab782790aafa604f173bf65fd56ac2))
* add s3 schema ([f8493ea](https://github.com/MapColonies/schemas/commit/f8493eacb2bb9228afc4389d68c24cb9531d2f27))
* added ajv formats ([#21](https://github.com/MapColonies/schemas/issues/21)) ([750ef31](https://github.com/MapColonies/schemas/commit/750ef31e2a517714de1708dffe354bb6ee23eb83))
* added check that schemas is valid according to ajv ([#18](https://github.com/MapColonies/schemas/issues/18)) ([a47780a](https://github.com/MapColonies/schemas/commit/a47780a433fa855067ef86552af6b8ee54c7641b))
* added telemetry schemas ([#13](https://github.com/MapColonies/schemas/issues/13)) ([6f33f47](https://github.com/MapColonies/schemas/commit/6f33f479d0322fecf144dd1133b0f0bbe6edd324))
* added validation to allow non breaking changes ([b21c155](https://github.com/MapColonies/schemas/commit/b21c155bb0688d27f5543a0aba6f8f297385bec9))
* added validation to ensure schema base type is object ([#17](https://github.com/MapColonies/schemas/issues/17)) ([32cbc14](https://github.com/MapColonies/schemas/commit/32cbc149bc598d6731d8c37a74f756b2fd0253ad))
* move logger as separated schema component ([3074ebe](https://github.com/MapColonies/schemas/commit/3074ebea314832380e8bf0c47f1a3c2e7b8e1ef0))
* upgraded json schema version to 2019-09 ([#34](https://github.com/MapColonies/schemas/issues/34)) ([23867cb](https://github.com/MapColonies/schemas/commit/23867cbfb1827a32ee6dae89813774972fb2deb9))


### Bug Fixes

* add folder "jobManager" ([77ff2f7](https://github.com/MapColonies/schemas/commit/77ff2f72faa327c8f8893ed0c4a3368910bcaf24))
* exported schema type is now pre calculated ([#23](https://github.com/MapColonies/schemas/issues/23)) ([7bb3ebb](https://github.com/MapColonies/schemas/commit/7bb3ebb0233ba724c1f867773a8715c0a3efbf42))
* id of new boilerplate ([ce6bf9f](https://github.com/MapColonies/schemas/commit/ce6bf9f4645bfb553d11b546b4255775482ada82))
* pr notes ([ef3d9d8](https://github.com/MapColonies/schemas/commit/ef3d9d876e33a1b5c8722b03125ccf59d763c252))
* removed env of arrays ([00391bf](https://github.com/MapColonies/schemas/commit/00391bfb4bd56fcebdd71fa095a79f9e8572f549))
* revert v5 ([179fb9a](https://github.com/MapColonies/schemas/commit/179fb9a524d95644d37964aa79884fdb287514cf))


### Code Refactoring

* set every latest version as only version ([#42](https://github.com/MapColonies/schemas/issues/42)) ([131cfce](https://github.com/MapColonies/schemas/commit/131cfce70730bcf722d194b547ed1d77015c9235))

## [0.2.1](https://github.com/MapColonies/schemas/compare/v0.2.0...v0.2.1) (2024-06-30)


### Bug Fixes

* changed build to generate export to the type symbol ([#11](https://github.com/MapColonies/schemas/issues/11)) ([d84e5ad](https://github.com/MapColonies/schemas/commit/d84e5ad0b80cb2009d367cbdc180dc05d774c4d7))

## [0.2.0](https://github.com/MapColonies/schemas/compare/v0.1.0...v0.2.0) (2024-06-17)


### Features

* created new version of partial s3 ([#9](https://github.com/MapColonies/schemas/issues/9)) ([9639222](https://github.com/MapColonies/schemas/commit/9639222d3fe6f24ddfa19fa773dbf8dae1bd9332))

## [0.1.0](https://github.com/MapColonies/schemas/compare/v0.0.1...v0.1.0) (2024-06-10)


### Features

* removed mts support for now ([#6](https://github.com/MapColonies/schemas/issues/6)) ([d35e8bc](https://github.com/MapColonies/schemas/commit/d35e8bc676a3af75c73851fa9e288df8da85cbb2))

## 0.0.1 (2024-04-08)


### Features

* initial implementation  ([#1](https://github.com/MapColonies/schemas/issues/1)) ([b1a22e9](https://github.com/MapColonies/schemas/commit/b1a22e9cd14fe4afaa960ef9cf01096743edda15))


### Miscellaneous Chores

* release 0.0.1 ([432f1b3](https://github.com/MapColonies/schemas/commit/432f1b3d659fe0bd9acec687db8ae6efacf4f49b))
