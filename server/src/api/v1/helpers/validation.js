const Joi = require('joi');
const vietnameseRegex = /^([a-vxyỳọáầảấờễàạằệếýộậốũứĩõúữịỗìềểẩớặòùồợãụủíỹắẫựỉỏừỷởóéửỵẳẹèẽổẵẻỡơôưăêâđ]+)((\s{1}[a-vxyỳọáầảấờễàạằệếýộậốũứĩõúữịỗìềểẩớặòùồợãụủíỹắẫựỉỏừỷởóéửỵẳẹèẽổẵẻỡơôưăêâđ]+){1,})$/;
const phoneNumberRegex = /(^[0-9]{10,11})$/;
const genderRegex = /(?:nam|nữ)$/;
const _idRegex = /(^[a-zA-Z0-9]{24,24})$/;

// how to add a new method into the Joi?
const validateUser = data =>{
    const UserSchema = Joi.object({
        email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .lowercase()
        .required(),
        password: Joi
        .string()
        .required(),
    });
    return UserSchema.validate(data);
}

const validateRegisterUser = data =>{
    const UserSchema = Joi.object({
        email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .lowercase()
        .required(),
        password: Joi
        .string()
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/) // at least 8 characters, 1 lowercase, 1 uppercase, special character
        .required(),
        repeatPassword: Joi.ref('password'),
        fullName: Joi
        .string()
        .max(200)
        .regex(vietnameseRegex)// only accept letters and spaces
        .required(),
        gender: Joi
        .string()
        .min(2)
        .max(3)
        .regex(genderRegex)
        // .required(),
    });
    data.fullName = data.fullName.toLowerCase();
    return UserSchema.validate(data);
}

const validateUpdateUser = data =>{
    const UserSchema = Joi.object({
        fullName: Joi
        .string()
        .max(200)
        .regex(vietnameseRegex)// only accept letters and spaces
        .required(),
        phone: Joi
        .string()
        .regex(phoneNumberRegex),
        gender: Joi
        .string()
        .min(2)
        .max(3)
        .regex(genderRegex)
        .required(),
        //address: Joi
        //dateOfBirth
        //avatar
        //coverImage
        //biography
        //hobby
        //job
    });
    data.fullName = data.fullName.toLowerCase();
    data.gender = data.gender.toLowerCase();
    return UserSchema.validate(data);
}

const validateEmail = data =>{
    const UserSchema = Joi.object({
        email: Joi
        .string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .lowercase()
        .required(),
    });
    return UserSchema.validate(data);
}

const validatePassword = data =>{
    const UserSchema = Joi.object({
        password: Joi
        .string()
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        .required(),
    });
    return UserSchema.validate(data);
}

const validatePasswordChange = data =>{
    const UserSchema = Joi.object({
        newPassword: Joi
        .string()
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        .required(),
        repeatPassword: Joi.ref('newPassword'),
    });
    return UserSchema.validate(data);
}

const validateUserID = data =>{
    const UserSchema = Joi.object({
        userID: Joi
        .string()
        .regex(_idRegex)
        .required(),
    });
    return UserSchema.validate(data);
}

const validateGroupPassword = data =>{
    const UserSchema = Joi.object({
        password: Joi
        .string()
        .regex(/[a-zA-Z0-9]{4,12}/)
        .required(),
    });
    return UserSchema.validate(data);
}

const validPost = data =>{
    const PostSchema = Joi.object({
        content: Joi
        .string()
        .trim()
        .min(1)
        .required()
    })
    return PostSchema.validate(data);

}


module.exports = {
    validateUser,
    validateRegisterUser,
    validateUpdateUser,
    validateEmail,
    validatePassword,
    validatePasswordChange,
    validateUserID,
    validateGroupPassword,
    validPost
}