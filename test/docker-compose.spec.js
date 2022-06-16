const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fse = require('fs-extra');
const { writeFileSync, mkdirSync, readFileSync } = require('fs');
const { expect } = require('expect');
const monitoringTypes = require('../jdl/jhipster/monitoring-types');
const { MICROSERVICE, MONOLITH } = require('../jdl/jhipster/application-types');
const { PROMETHEUS } = require('../jdl/jhipster/monitoring-types');
const GeneratorBase = require('../generators/generator-base');

const { loadDerivedAppConfig, loadDerivedServerConfig } = GeneratorBase.prototype;
const NO_MONITORING = monitoringTypes.NO;

const expectedFiles = {
  dockercompose: ['docker-compose.yml', 'central-server-config/application.yml'],
  prometheus: ['prometheus-conf/alert_rules.yml', 'prometheus-conf/prometheus.yml', 'alertmanager-conf/config.yml'],
  monolith: ['docker-compose.yml'],
};

const writeCallbacks = (filePath, ...callbacks) => {
  let content;
  try {
    content = readFileSync(filePath).toString();
    // eslint-disable-next-line no-empty
  } catch (_error) {}
  for (const callback of callbacks) {
    content = callback(content, filePath);
  }
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  return (...callbacks) => writeCallbacks(filePath, ...callbacks);
};

const applications = {
  '01-gateway': {
    applicationType: 'gateway',
    baseName: 'jhgate',
    databaseType: 'sql',
    prodDatabaseType: 'mysql',
    serviceDiscoveryType: 'eureka',
  },
  '02-mysql': {
    applicationType: 'microservice',
    baseName: 'msmysql',
    databaseType: 'sql',
    prodDatabaseType: 'mysql',
    serviceDiscoveryType: 'eureka',
  },
  '03-psql': {
    applicationType: 'microservice',
    baseName: 'mspsql',
    databaseType: 'sql',
    prodDatabaseType: 'postgresql',
    searchEngine: 'elasticsearch',
  },
  '04-mongo': {
    applicationType: 'microservice',
    baseName: 'msmongodb',
    databaseType: 'mongodb',
  },
  '05-cassandra': {
    applicationType: 'microservice',
    baseName: 'mscassandra',
    databaseType: 'cassandra',
  },
  '07-mariadb': {
    applicationType: 'microservice',
    baseName: 'msmariadb',
    databaseType: 'sql',
    prodDatabaseType: 'mariadb',
  },
  '08-monolith': {
    applicationType: 'monolith',
    baseName: 'sampleMysql',
    databaseType: 'sql',
    prodDatabaseType: 'mysql',
    searchEngine: 'elasticsearch',
  },
  '10-couchbase': {
    applicationType: 'microservice',
    baseName: 'mscouchbase',
    databaseType: 'couchbase',
  },
  '12-oracle': {
    applicationType: 'monolith',
    baseName: 'oracle-mono',
    databaseType: 'sql',
    prodDatabaseType: 'oracle',
  },
};

const createMockedConfig = (appDir, testDir) => {
  const generator = {
    testDir,
    editFile(filePath, ...callbacks) {
      return writeCallbacks(filePath, ...callbacks);
    },
  };

  mkdirSync(`${appDir}/target/jib-cache`, { recursive: true });

  const appConfig = applications[appDir];
  generator.editFile(`${appDir}/.yo-rc.json`, () => JSON.stringify({ 'generator-jhipster': { ...appConfig, mockAppConfig: undefined } }));
  Object.assign(generator, appConfig);
  loadDerivedAppConfig.call(GeneratorBase.prototype, generator);
  loadDerivedServerConfig.call(GeneratorBase.prototype, generator);

  if (appConfig.mockAppConfig) {
    appConfig.mockAppConfig(generator, appDir, testDir);
  } else {
    fse.copySync(path.join(__dirname, `./templates/compose/${appDir}`), path.join(testDir, appDir));
  }

  return generator;
};

describe('JHipster Docker Compose Sub Generator', () => {
  describe('only gateway', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway'],
          clusteredDbApps: [],
          monitoring: NO_MONITORING,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('only one microservice', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['02-mysql'],
          clusteredDbApps: [],
          monitoring: NO_MONITORING,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('one microservice and a directory path without a trailing slash', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: '.',
          chosenApps: ['02-mysql'],
          clusteredDbApps: [],
          monitoring: NO_MONITORING,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('Correct the directory path by appending a trailing slash', () => {
      assert.fileContent('.yo-rc.json', '"directoryPath": "./"');
    });
  });

  describe('gateway and one microservice, without monitoring', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql'],
          clusteredDbApps: [],
          monitoring: NO_MONITORING,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and one microservice', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('no prometheus files', () => {
      assert.noFile(expectedFiles.prometheus);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and one microservice, with curator', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('no prometheus files', () => {
      assert.noFile(expectedFiles.prometheus);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and one microservice, with prometheus', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql'],
          clusteredDbApps: [],
          monitoring: PROMETHEUS,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates expected prometheus files', () => {
      assert.file(expectedFiles.prometheus);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and multi microservices', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
          createMockedConfig('03-psql', dir);
          createMockedConfig('04-mongo', dir);
          createMockedConfig('07-mariadb', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql', '03-psql', '04-mongo', '07-mariadb'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and multi microservices, with 1 mongodb cluster', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
          createMockedConfig('03-psql', dir);
          createMockedConfig('04-mongo', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql', '03-psql', '04-mongo'],
          clusteredDbApps: ['04-mongo'],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and 1 microservice, with Cassandra', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('05-cassandra', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '05-cassandra'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('monolith', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('08-monolith', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MONOLITH,
          directoryPath: './',
          chosenApps: ['08-monolith'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.monolith);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and multi microservices, with couchbase', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('02-mysql', dir);
          createMockedConfig('03-psql', dir);
          createMockedConfig('10-couchbase', dir);
          createMockedConfig('07-mariadb', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '02-mysql', '03-psql', '10-couchbase', '07-mariadb'],
          clusteredDbApps: [],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('gateway and 1 microservice, with 1 couchbase cluster', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('01-gateway', dir);
          createMockedConfig('10-couchbase', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MICROSERVICE,
          directoryPath: './',
          chosenApps: ['01-gateway', '10-couchbase'],
          clusteredDbApps: ['10-couchbase'],
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.dockercompose);
    });
    it('creates jhipster-registry content', () => {
      assert.fileContent('docker-compose.yml', /jhipster-registry:8761\/config/);
    });
    it('creates compose file without container_name, external_links, links', () => {
      assert.noFileContent('docker-compose.yml', /container_name:/);
      assert.noFileContent('docker-compose.yml', /external_links:/);
      assert.noFileContent('docker-compose.yml', /links:/);
    });
  });

  describe('oracle monolith', () => {
    let runResult;
    before(async () => {
      runResult = await helpers
        .create(require.resolve('../generators/docker-compose'))
        .doInDir(dir => {
          createMockedConfig('12-oracle', dir);
        })
        .withOptions({ skipChecks: true, reproducibleTests: true })
        .withPrompts({
          deploymentApplicationType: MONOLITH,
          directoryPath: './',
          chosenApps: ['12-oracle'],
          clusteredDbApps: [],
          monitoring: NO_MONITORING,
        })
        .run();
    });
    it('should match files snapshot', function () {
      expect(runResult.getSnapshot()).toMatchSnapshot();
    });
    it('creates expected default files', () => {
      assert.file(expectedFiles.monolith);
    });
  });
});
