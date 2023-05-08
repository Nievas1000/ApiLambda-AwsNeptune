# ApiLambda - AwsNeptune

## Technologies

- Lambda
- Serverless
- Axios
- Eslint
- Prettier
- Snyk
- Gremlin

## Getting Started

1. Clone the repository: `git clone https://github.com/your-username/ExpressApi.git`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Serverless Deployment

This project uses the serverless framework to deploy the Lambda function to AWS.

### Prerequisites

Before deploying the Lambda function, make sure you have the following:

- An AWS account
- The AWS CLI installed and configured with your account credentials
- The serverless framework installed globally on your machine

To deploy the Lambda function, run the following command:

### `serverless deploy`

## Gremlin queries with AWS Neptune

This project uses AWS Neptune as the graph database and Gremlin as the query language to interact with it.

### Getting Started

- Create an AWS Neptune database and note its endpoint URL.
- Install Gremlin Console and connect to your Neptune database using the endpoint URL and your database credentials.
- Write your Gremlin queries and execute them in Gremlin Console to interact with your Neptune database.

## Code Quality

We use Eslint and Prettier to enforce code style and formatting. To run the linter and formatter, use the following command:

### `npm run lint`

## Security

We use Snyk to scan for vulnerabilities in our dependencies. To check for vulnerabilities, use the following command:

### `npm run snyk`

## HTTP requests

We use Axios to make HTTP requests to external services.

## GitHub Actions

We use GitHub Actions for continuous integration and continuous deployment.
