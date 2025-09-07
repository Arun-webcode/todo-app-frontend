import { Injectable } from '@angular/core';
import api from '../config/api.service' // 👈 import your axios instance
import { ApiUrls, Constants } from '../config/constants';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private storageService: StorageService
  ) { }

  async getToken() {
    return await this.storageService.getItem(Constants.AUTH_TOKEN);
  }

  async sendOtp(email: string): Promise<any> {
    const res = await api.post(ApiUrls.auth.otpGen, { email });
    return res.data;
  }

  async registerAccount(email: string, password: string, name: string, otp: string): Promise<any> {
    const body = { email, password, name, otp };
    const res = await api.post(ApiUrls.auth.register, body);
    return res.data;
  }

  async sendResetPasswordOtp(email: string): Promise<any> {
    const res = await api.post(ApiUrls.auth.resetOtp, { email });
    return res.data;
  }

  async resetPassword(email: string, newPassword: string, otp: string): Promise<any> {
    const body = { email, otp, newPassword };
    const res = await api.put(ApiUrls.auth.resetPass, body);
    return res.data;
  }

  async login(email: string, password: string): Promise<any> {
    const body = { email, password };
    const res = await api.post(ApiUrls.auth.login, body);
    return res.data;
  }

  async logout(): Promise<any> {
    const res = await api.get(ApiUrls.auth.logout);
    return res.data;
  }

  async deleteAccount(password: string): Promise<any> {
    const res = await api.delete(ApiUrls.auth.deleteAcc, {
      data: { password }
    });
    return res.data;
  }

  async updateProfile(name: string, bio: string): Promise<any> {
    const body = { name, bio };
    const res = await api.put(ApiUrls.profileUpdate, body);
    return res.data;
  }

  async getUserDetails(): Promise<any> {
    const res = await api.get(ApiUrls.auth.getUserDetails);
    return res.data;
  }
}
