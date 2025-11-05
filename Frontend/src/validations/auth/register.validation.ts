import * as yup from "yup";
export const registerSchema = yup.object().shape({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    email: yup.string().required("Email is required"),
    userType: yup.string().required("User type is required"),
    password: yup
        .string()
        .min(8, "Must be at least 8 characters")
        .max(50, "Password must be at most 50 characters")
        .matches(
            /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[-!$%^&*()_+|~=`{}\[\]:;"'<>,.?\\/@#])/,
            "Password must contain at least one number, one lowercase letter, one uppercase letter, and one special character"
        )
        .required("Password is required"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords must match") // Remove the `null` value
        .required("Confirm Password is required"),
});
export interface IRegister extends yup.InferType<typeof registerSchema> { }