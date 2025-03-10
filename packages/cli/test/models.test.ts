import { execa } from 'execa'
import stripAnsi from 'strip-ansi'

const MY_MODEL_JSON =
  '{"name":"MyModel","accountRelation":"list","schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"stringPropName":{"type":"string","maxLength":80}},"additionalProperties":false,"required":["stringPropName"]}}'

describe('models', () => {
  const seed = '0fb8e384cfced0f4c767118a68a66e8992c32d1bb7b02155113af1c7d5179502'

  describe('model:create', () => {
    test('model creation fails without the content param', async () => {
      await expect(execa('bin/run.js', ['model:create'])).rejects.toThrow(
        /Model content \(JSON encoded as string\)/
      )
    }, 60000)

    test('model creation fails without the did-key param', async () => {
      const create = await execa('bin/run.js', ['model:create', MY_MODEL_JSON])
      expect(
        create.stderr
          .toString()
          .includes(
            'DID is not authenticated, make sure to provide a private key using the "did-private-key" flag'
          )
      ).toBe(true)
    }, 60000)

    test('model creation succeeds', async () => {
      const create = await execa('bin/run.js', [
        'model:create',
        MY_MODEL_JSON,
        `--did-private-key=${seed}`,
      ])
      expect(create.stderr.toString().includes('Done')).toBe(true)
    }, 60000)
  })

  describe('model:content', () => {
    test('model content display fails without the streamID', async () => {
      await expect(execa('bin/run.js', ['model:content'])).rejects.toThrow(
        /streamId {2}ID of the stream/
      )
    }, 60000)

    test('model content display succeeds', async () => {
      const create = await execa('bin/run.js', [
        'model:create',
        MY_MODEL_JSON,
        `--did-private-key=${seed}`,
      ])

      const content = await execa('bin/run.js', [
        `model:content`,
        create.stdout.toString().trim(),
        `--sync=sync-always`,
      ])
      const lines = stripAnsi(content.stdout.toString())
      expect(lines.includes('"name":"MyModel"')).toBe(true)
      expect(lines.includes('"schema":{')).toBe(true)
      expect(lines.includes('"type":"object",')).toBe(true)
      expect(lines.includes('"properties":{')).toBe(true)
      expect(lines.includes('"accountRelation":"list"')).toBe(true)
      expect(lines.includes('"$schema":"https://json-schema.org/draft/2020-12/schema",')).toBe(true)
    }, 60000)
  })

  describe('model:controller', () => {
    test('model controller display fails without the streamID', async () => {
      await expect(execa('bin/run.js', ['model:controller'])).rejects.toThrow(
        /streamId {2}ID of the stream/
      )
    }, 60000)

    test('model controller display succeeds', async () => {
      const create = await execa('bin/run.js', [
        'model:create',
        MY_MODEL_JSON,
        `--did-private-key=${seed}`,
      ])

      const controller = await execa('bin/run.js', [
        `model:controller`,
        create.stdout.toString().trim(),
        `--sync=sync-always`,
      ])

      expect(controller.stderr.toString().includes('Loading the model... Done!')).toBe(true)
      expect(controller.stdout.toString().trim()).toEqual(
        'did:key:z6MkpRhEWywReoFtQMQGqSmTu5mp9vQVok86Qha2sn6e32Db'
      )
    }, 60000)
  })

  describe.skip('model:list', () => {
    // Logic needs to be updated so that indexer is configured to index models
    beforeAll(async () => {
      await execa('bin/run.js', [
        'composite:deploy',
        'test/mocks/encoded.composite.profiles.json',
        `--did-private-key=${seed}`,
      ])
    }, 60000)

    test('model list succeeds', async () => {
      const models = await execa('bin/run.js', [
        'model:list',
        '--indexer-url=http://localhost:7007',
      ])
      expect(stripAnsi(models.stdout.toString()).includes('GenericProfile')).toBe(true)
      expect(stripAnsi(models.stdout.toString()).includes('SocialProfile')).toBe(true)
      expect(stripAnsi(models.stdout.toString()).includes('PersonProfile')).toBe(true)
    }, 60000)

    test('model list succeeds with --table argument', async () => {
      const models = await execa('bin/run.js', [
        'model:list',
        '--indexer-url=http://localhost:7007',
        '--table',
      ])
      expect(stripAnsi(models.stdout.toString()).includes('GenericProfile')).toBe(true)
      expect(stripAnsi(models.stdout.toString()).includes('SocialProfile')).toBe(true)
      expect(stripAnsi(models.stdout.toString()).includes('PersonProfile')).toBe(true)
    }, 60000)
  })
})
