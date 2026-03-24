import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import { ApiError } from '@dam/utils'

 
const repoMock = {
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  createEmailVerificationToken: vi.fn(),
  findEmailVerificationToken: vi.fn(),
  markEmailTokenUsed: vi.fn(),
  updateUser: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findPasswordResetToken: vi.fn(),
  markPasswordResetTokenUsed: vi.fn(),
}

const tokenMock = {
  generateEmailVerificationToken: vi.fn(),
  getEmailVerificationTokenExpiryDate: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  getRefreshTokenExpiryDate: vi.fn(),
  verifyRefreshToken: vi.fn(),
  generatePasswordResetToken: vi.fn(),
  getPasswordResetTokenExpiryDate: vi.fn(),
}

const activityMock = {
  logActivity: vi.fn(),
}

 
vi.mock('@dam/repository', () => {
  return {
    AuthRepository: class {
      findUserByEmail = repoMock.findUserByEmail
      createUser = repoMock.createUser
      createEmailVerificationToken = repoMock.createEmailVerificationToken
      findEmailVerificationToken = repoMock.findEmailVerificationToken
      markEmailTokenUsed = repoMock.markEmailTokenUsed
      updateUser = repoMock.updateUser
      createRefreshToken = repoMock.createRefreshToken
      findRefreshToken = repoMock.findRefreshToken
      revokeRefreshToken = repoMock.revokeRefreshToken
      revokeAllUserRefreshTokens = repoMock.revokeAllUserRefreshTokens
      createPasswordResetToken = repoMock.createPasswordResetToken
      findPasswordResetToken = repoMock.findPasswordResetToken
      markPasswordResetTokenUsed = repoMock.markPasswordResetTokenUsed
    }
  }
})

vi.mock('../../services/token.service.js', () => {
  return {
    TokenService: class {
      generateEmailVerificationToken = tokenMock.generateEmailVerificationToken
      getEmailVerificationTokenExpiryDate = tokenMock.getEmailVerificationTokenExpiryDate
      generateAccessToken = tokenMock.generateAccessToken
      generateRefreshToken = tokenMock.generateRefreshToken
      getRefreshTokenExpiryDate = tokenMock.getRefreshTokenExpiryDate
      verifyRefreshToken = tokenMock.verifyRefreshToken
      generatePasswordResetToken = tokenMock.generatePasswordResetToken
      getPasswordResetTokenExpiryDate = tokenMock.getPasswordResetTokenExpiryDate
    }
  }
})

vi.mock('@dam/common', () => {
  return {
    ActivityService: class {
      logActivity = activityMock.logActivity
    }
  }
})

vi.mock('@dam/mail', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('bcrypt')

 
import { AuthService } from '../../services/auth.service.js'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@dam/mail'

 
describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AuthService()
  })

  it('should register a new user', async () => {
    repoMock.findUserByEmail.mockResolvedValue(null)

    ;(bcrypt.hash as any).mockResolvedValue('hashed')

    repoMock.createUser.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      password: 'hashed',
      username: 'testuser',
    })

    tokenMock.generateEmailVerificationToken.mockReturnValue('token')
    tokenMock.getEmailVerificationTokenExpiryDate.mockReturnValue(new Date())

    const result = await service.register(
      {
        email: 'test@test.com',
        password: 'password123',
        username: 'testuser',
      },
      '127.0.0.1',
    )

    expect(repoMock.createUser).toHaveBeenCalled()
    expect(sendVerificationEmail).toHaveBeenCalled()
    expect(result.user.email).toBe('test@test.com')
  })

  it('should throw error if email exists', async () => {
    repoMock.findUserByEmail.mockResolvedValue({ id: 1 })

    await expect(
      service.register(
        { email: 'test@test.com', password: '123', username: 'test' },
        '127.0.0.1',
      ),
    ).rejects.toThrow(ApiError)
  })

  it('should login successfully', async () => {
    repoMock.findUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      password: 'hashed',
      isEmailVerified: true,
      isActive: true,
    })

    ;(bcrypt.compare as any).mockResolvedValue(true)

    tokenMock.generateAccessToken.mockReturnValue('access')
    tokenMock.generateRefreshToken.mockReturnValue('refresh')
    tokenMock.getRefreshTokenExpiryDate.mockReturnValue(new Date())

    const result = await service.login(
      'test@test.com',
      'password',
      '127.0.0.1',
      'agent',
    )

    expect(result.accessToken).toBe('access')
    expect(result.refreshToken).toBe('refresh')
  })

  it('should verify email', async () => {
    repoMock.findEmailVerificationToken.mockResolvedValue({
      id: 1,
      userId: 1,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10000),
    })

    await service.verifyEmail('token')

    expect(repoMock.markEmailTokenUsed).toHaveBeenCalled()
    expect(repoMock.updateUser).toHaveBeenCalled()
  })

  it('should refresh tokens', async () => {
    tokenMock.verifyRefreshToken.mockReturnValue({ userId: 1 })

    repoMock.findRefreshToken.mockResolvedValue({
      token: 'old',
      revoked: false,
      expiresAt: new Date(Date.now() + 10000),
      user: { id: 1, email: 'test@test.com', isActive: true },
    })

    tokenMock.generateAccessToken.mockReturnValue('newAccess')
    tokenMock.generateRefreshToken.mockReturnValue('newRefresh')

    const result = await service.refreshToken('old')

    expect(result.accessToken).toBe('newAccess')
  })

  it('should logout', async () => {
    repoMock.findRefreshToken.mockResolvedValue({ token: 'abc' })

    await service.logout('abc', 1)

    expect(repoMock.revokeRefreshToken).toHaveBeenCalledWith('abc')
  })

  it('should send password reset email', async () => {
    repoMock.findUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      isEmailVerified: true,
    })

    tokenMock.generatePasswordResetToken.mockReturnValue('token')
    tokenMock.getPasswordResetTokenExpiryDate.mockReturnValue(new Date())

    await service.forgotPassword('test@test.com')

    expect(sendPasswordResetEmail).toHaveBeenCalled()
  })

  it('should reset password', async () => {
    repoMock.findPasswordResetToken.mockResolvedValue({
      id: 1,
      userId: 1,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10000),
    })

    ;(bcrypt.hash as any).mockResolvedValue('hashed')

    await service.resetPassword('token', 'newpass')

    expect(repoMock.updateUser).toHaveBeenCalled()
    expect(repoMock.markPasswordResetTokenUsed).toHaveBeenCalled()
  })

  it('should resend verification email', async () => {
    repoMock.findUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      isEmailVerified: false,
    })

    tokenMock.generateEmailVerificationToken.mockReturnValue('token')
    tokenMock.getEmailVerificationTokenExpiryDate.mockReturnValue(new Date())

    await service.resendVerificationEmail('test@test.com')

    expect(sendVerificationEmail).toHaveBeenCalled()
  })
})