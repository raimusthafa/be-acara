import { Request, Response } from "express";
import * as Yup from "yup";
import UserModel from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { iReqUser } from "../middleware/auth.middleware";

type TRegister = {
  fullname: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Tlogin = {
  identifier: string;
  password: string;
};

const registerValidationSchema = Yup.object({
  fullname: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().required(),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref("password"), ""], "Passwords do not match"),
});

export default {
  async register(req: Request, res: Response) {
    const { fullname, username, email, password, confirmPassword } =
      req.body as unknown as TRegister;
    console.log("REQ BODY:", req.body);

    try {
      await registerValidationSchema.validate({
        fullname,
        username,
        email,
        password,
        confirmPassword,
      });
      const result = await UserModel.create({
        fullname,
        username,
        email,
        password,
      });

      res.status(200).json({
        massage: "Registration successful",
        data: result,
      });
    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({
        massage: err.message,
        data: null,
      });
    }
  },
  async login(req: Request, res: Response) {
        /**
     #swagger.requestBody = {
     required: true,
     schema: {$ref: "#components/schemas/LoginRequest"}
     }
     */
    try {
      // ambil data user berdasarkan identifier = email & username
      const { identifier, password } = req.body as unknown as Tlogin;

      const userByIndentifier = await UserModel.findOne({
        $or: [
          {
            email: identifier,
          },
          {
            username: identifier,
          },
        ],
      });
      if (!userByIndentifier) {
        return res.status(403).json({
          message: "User not found",
          data: null,
        });
      }
      // validasi password
      const validatePassword: boolean =
        encrypt(password) === userByIndentifier.password;
      if (!validatePassword) {
        return res.status(403).json({
          message: "Password salah",
          data: null,
        });
      }

      const token = generateToken({
        id: userByIndentifier._id,
        role: userByIndentifier.role,
    });

      res.status(200).json({
        massage: "Login success",
        data: token,
      });

    } catch (error) {
      const err = error as unknown as Error;
      res.status(400).json({
        massage: err.message,
        data: null,
      });
    }
  },
  async me(req: iReqUser, res: Response) {
 // #swagger.security = [{ "bearerAuth": [] }]
    try {
     const user = req.user;
     const result = await UserModel.findById(user?.id);
     res.status(200).json({
        message: "Succes get user profile",
        data: result,
     });
    } catch (error) {
      const err = error as unknown as Error;
        res.status(400).json({
        massage: err.message,
        data: null,
      });
    }
  },
};
