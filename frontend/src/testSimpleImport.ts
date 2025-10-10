import { testFunction } from './services/simpleTest'
import type { TestInterface } from './services/simpleTest'

console.log(testFunction())

// Use the interface to avoid the unused warning
const testInterface: TestInterface = { name: 'test' }
console.log(testInterface)
