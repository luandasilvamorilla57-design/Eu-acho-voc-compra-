import { describe,expect,it } from 'vitest'
import { hasPhotoAssistant } from './plan'

describe('plan entitlements',()=>{
  it('keeps photo assistant locked on Start',()=>expect(hasPhotoAssistant('start')).toBe(false))
  it('unlocks photo assistant on Pro and Max',()=>{
    expect(hasPhotoAssistant('pro')).toBe(true)
    expect(hasPhotoAssistant('max')).toBe(true)
  })
})
