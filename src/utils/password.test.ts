import {describe,expect,it} from 'vitest'
import {PASSWORD_MIN_LENGTH,passwordChecks,passwordError} from './password'

describe('password policy',()=>{
  it('requires at least eight characters',()=>{
    expect(PASSWORD_MIN_LENGTH).toBe(8)
    expect(passwordError('Ab1!xyz')).toContain('8')
  })

  it('requires upper, lower, number and symbol',()=>{
    expect(passwordError('radar123!')).toContain('maiúscula')
    expect(passwordError('RADAR123!')).toContain('minúscula')
    expect(passwordError('RadarSeguro!')).toContain('número')
    expect(passwordError('Radar1234')).toContain('especial')
  })

  it('exposes live checklist state',()=>{
    expect(passwordChecks('Radar123!')).toEqual({
      length:true,
      upper:true,
      lower:true,
      number:true,
      symbol:true
    })
  })

  it('accepts a strong password',()=>{
    expect(passwordError('Radar123!')).toBe('')
  })
})
