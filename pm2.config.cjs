module.exports = {
  apps: [{
    name: "app",
    script: "src/server.ts",
    watch: true,
    ignore_watch: ["public", "logs"],
    autorestart: true,
    env: {
      NODE_ENV: "development",
      PORT: 3000,
      MONGO_URI: "mongodb://172.16.1.40:27017/notice-pdf",
      AWS_S3_BUCKET: 'notice-pdf-generator-bucket',
      AWS_REGION: '',
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      MAX_CONCURRENT_JOBS : 5,
    },
    env_production: {
      NODE_ENV: "development",
      PORT: 3000,
      MONGO_URI: "mongodb://172.16.1.40:27017/notice-pdf",
      AWS_S3_BUCKET: 'notice-pdf-generator-bucket',
      AWS_REGION: '',
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      MAX_CONCURRENT_JOBS : 5,
    },
  }]
};
