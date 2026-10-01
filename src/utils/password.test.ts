import {describe,expect,it} from 'vitest'
import {PASSWORD_MIN_LENGTH,passwordError} from './password'

describe('password policy',()=>{
  it('rejects passwords that are too short',()=>{
    expect(PASSWORD_MIN_LENGTH).toBe(10)
    expect(passwordError('abc123')).toContain('10')
  })
  it('requires a letter and a number',()=>{
    expect(passwordError('abcdefghij')).toContain('letra')
    expect(passwordError('1234567890')).toContain('letra')
  })
  it('accepts a sufficiently long mixed password',()=>{
    expect(passwordError('radarSeguro2026')).toBe('')
  })
})
