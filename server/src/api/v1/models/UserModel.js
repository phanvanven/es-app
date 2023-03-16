const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const phoneNumber = new Schema({
  number: {
    type: String,
    minLength: 10,
    maxLength: 11,
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const dateOfBirth = new Schema({
  date: {
    type: Date,
    required: true,
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const Address = new Schema({
  address: {
    type: String,
    default: "unknown",
    maxLength: 255,
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const Job = new Schema({
  jobList: {
    type: [String],
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const Biography = new Schema({
  name: {
    type: String,
    maxLength: 300,
  },
  hide: {
    type: Boolean,
    default: false,
  },
});

const UserSchema = new Schema(
  {
    profileID: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    fullName: {
      type: String,
      maxLength: 200,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      required: true,
      default: "nam",
      maxLength: 3,
    },
    phoneNumber: {
      type: phoneNumber,
    },
    dateOfBirth: {
      type: dateOfBirth,
    },
    address: {
      type: Address,
    },
    biography: {
      type: Biography,
    },
    jobs: {
      type: Job,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "users",
  }
);

// middleware: xử lý dữ liệu trước khi thêm vào database
// NOTE: sử dụng phương thức save bên controller (có hỗ trợ middleware) thay cho create
UserSchema.pre("save", async function (next) {
  try {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }else{
      console.log("->>> No password, next middleware is called");
    }
    next();
  } catch (error) {
    next(error);
  }
});
// Xem thêm các phương thức hỗ trợ middleware (không hỗ trợ cho atomic) https://mongoosejs.com/docs/middleware.html
UserSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const password = this._update.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      this._update.password = hashedPassword;
    }else{
      console.log("->>> No password, next middleware is called");
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Định nghĩa một phương thức mới trước khi import dữ liệu vào database
// Không sử dụng arrow function trong trường hợp này (vì sử dụng this)
UserSchema.methods.isCheckPassword = async function (password, next) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    next(error);
  }
};

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
