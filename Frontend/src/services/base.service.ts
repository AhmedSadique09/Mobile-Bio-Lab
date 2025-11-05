import axios from "axios";
import type { CancelTokenStatic, CancelTokenSource } from "axios";
import Cookies from 'js-cookie';
import { UN_AUTHENTICATED_ROUTES } from "../routes/routes";

const Config = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class HttpService {
  CancelToken: CancelTokenStatic;
  source: CancelTokenSource;

  constructor() {
    this.CancelToken = axios.CancelToken;
    this.source = this.CancelToken.source();
    
    // Ensure token is set in headers on initialization
    const token = HttpService.getToken();
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(undefined, function (error) {
      // if (error?.response?.status === 400 || error?.response?.status === 409 || error?.response?.status === 500) {
      //   toast.error(error.response.data.message)
      // }

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        HttpService.clearCookie();
        
        // Clear axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        // Cookies
        
        // window.location.reload();
        
        // Only redirect if we're not already on the login page to avoid redirect loops
        if (window.location.pathname !== '/') {
          window.location.href = UN_AUTHENTICATED_ROUTES.LOGIN as string;
        }
      }
      
      return Promise.reject(error);
    });
  }

  /**
   * Set Token On Header
   * @param token
   */
  static setToken(token: string): void {
    // Cookies.set("token", token, { expires: 1/288, secure: true, sameSite: "strict" }); 
    const expiresIn3Minutes = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

    // Set the token in cookies with the expiration date
    Cookies.set("token", token, {
      expires: expiresIn3Minutes,
      secure: true,
      sameSite: "strict",
    });
    
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    // // Debug logging
    // console.log('Token set in axios headers:', axios.defaults.headers.common['Authorization']);
  }

  /**
   * Retrieves the token from the cookies.
   * @returns {string | undefined} The token value if found, otherwise undefined.
   */
  static getToken(): string {
    return Cookies.get("token") ?? "";
  }
  
  static clearCookie() {
    Cookies.remove("token");
    Cookies.remove("userId");
    Cookies.remove("email");
    Cookies.remove("fullName");
    // Remove Authorization header from axios
    delete axios.defaults.headers.common['Authorization'];
  }

  /**
   * Sets a cookie with the specified name and value.
   * @param {string} name The name of the cookie.
   * @param {string} value The value to be stored in the cookie.
   * @param {number | Date} [expires=1] The expiration time in days or a specific Date object.
   */
  static setCookie(name: string, value: string, _expires: number | Date = 1): void {
    // const expiryTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);       //  1 day
    const expiryTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    Cookies.set(name, value, {
      expires: expiryTime,
      secure: true,
      sameSite: "strict",
    });
  }

  /**
   * Fetch data from server
   * @param url Endpoint link
   * @return Promise
   */
  protected get = async (url: string, params?: any): Promise<any> => {
    const res = await axios.get(`${Config}/${url}`, {
      params,
      cancelToken: this.source.token,
    });
    return res.data;
  };

  /**
   * Write data over server
   * @param url Endpoint link
   * @param body Data to send over server
   * @return Promise
   */
  protected post = async (
    url: string,
    body?: any,
    options = {}
  ): Promise<any> => {
    const res = await axios.post(`${Config}/${url}`, body, {
      ...options,
      cancelToken: this.source.token,
    });
    return res.data;
  };

  /**
   * Delete Data From Server
   * @param url Endpoint link
   * @param params Embed as query params
   * @return Promise
   */
  protected delete = async (
    url: string,
    params?: any,
    data?: any
  ): Promise<any> => {
    const res = await axios.delete(`${Config}/${url}`, { params, data });
    return res.data;
  };

  /**
   * Update data on server
   * @param url Endpoint link
   * @param body Data to send over server
   * @param params Embed as query params
   * @return Promise
   */
  put = async (url: string, body?: any, params?: any): Promise<any> => {
    const res = await axios.put(`${Config}/${url}`, body, {
      ...params,
      cancelToken: this.source.token,
    });
    return res.data;
  };

  private updateCancelToken() {
    this.source = this.CancelToken.source();
  }

  cancel = () => {
    this.source.cancel("Explicitly cancelled HTTP request");
    this.updateCancelToken();
  };
}

