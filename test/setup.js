const { expect } = require('chai');
const supertest = require('supertest');
process.env.TZ = 'UTC';
process.env.NODE_ENV = 'test';

require('dotenv').config();

global.expect = expect;
global.supertest = supertest;
