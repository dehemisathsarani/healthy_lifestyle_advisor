import { testExport } from './services/testApi'
import type { TestInterface } from './services/testApi'

console.log(testExport)

// Use the interface to avoid the unused warning
const testInterface: TestInterface = { id: '1', name: 'test' }
console.log(testInterface)
