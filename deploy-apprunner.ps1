$ApiImageUri = "541259832110.dkr.ecr.ap-south-1.amazonaws.com/spin-api:latest"
$AgentImageUri = "541259832110.dkr.ecr.ap-south-1.amazonaws.com/spin-agent:latest"
$AccessRoleArn = "arn:aws:iam::541259832110:role/AppRunnerECRAccessRole"

Write-Host "Deploying API to AWS App Runner..."
aws apprunner create-service `
    --service-name spin-api `
    --source-configuration "{ `"ImageRepository`": { `"ImageIdentifier`": `"$ApiImageUri`", `"ImageRepositoryType`": `"ECR`", `"ImageConfiguration`": { `"Port`": `"8080`" } }, `"AuthenticationConfiguration`": { `"AccessRoleArn`": `"$AccessRoleArn`" } }" `
    --instance-configuration "Cpu=1024,Memory=2048"

Write-Host "Deploying Intake Agent to AWS App Runner..."
aws apprunner create-service `
    --service-name spin-intake `
    --source-configuration "{ `"ImageRepository`": { `"ImageIdentifier`": `"$AgentImageUri`", `"ImageRepositoryType`": `"ECR`", `"ImageConfiguration`": { `"Port`": `"8080`", `"RuntimeEnvironmentVariables`": { `"AGENT_SERVICE`": `"intake`" } } }, `"AuthenticationConfiguration`": { `"AccessRoleArn`": `"$AccessRoleArn`" } }" `
    --instance-configuration "Cpu=1024,Memory=2048"

Write-Host "Deploying Parsing Agent to AWS App Runner..."
aws apprunner create-service `
    --service-name spin-parsing `
    --source-configuration "{ `"ImageRepository`": { `"ImageIdentifier`": `"$AgentImageUri`", `"ImageRepositoryType`": `"ECR`", `"ImageConfiguration`": { `"Port`": `"8080`", `"RuntimeEnvironmentVariables`": { `"AGENT_SERVICE`": `"parsing`" } } }, `"AuthenticationConfiguration`": { `"AccessRoleArn`": `"$AccessRoleArn`" } }" `
    --instance-configuration "Cpu=1024,Memory=2048"

Write-Host "Deploying Geospatial Agent to AWS App Runner..."
aws apprunner create-service `
    --service-name spin-geospatial `
    --source-configuration "{ `"ImageRepository`": { `"ImageIdentifier`": `"$AgentImageUri`", `"ImageRepositoryType`": `"ECR`", `"ImageConfiguration`": { `"Port`": `"8080`", `"RuntimeEnvironmentVariables`": { `"AGENT_SERVICE`": `"geospatial`" } } }, `"AuthenticationConfiguration`": { `"AccessRoleArn`": `"$AccessRoleArn`" } }" `
    --instance-configuration "Cpu=1024,Memory=2048"

Write-Host "Deploying Policy Agent to AWS App Runner..."
aws apprunner create-service `
    --service-name spin-policy `
    --source-configuration "{ `"ImageRepository`": { `"ImageIdentifier`": `"$AgentImageUri`", `"ImageRepositoryType`": `"ECR`", `"ImageConfiguration`": { `"Port`": `"8080`", `"RuntimeEnvironmentVariables`": { `"AGENT_SERVICE`": `"policy`" } } }, `"AuthenticationConfiguration`": { `"AccessRoleArn`": `"$AccessRoleArn`" } }" `
    --instance-configuration "Cpu=1024,Memory=2048"

Write-Host "Done! Services are provisioning on AWS App Runner."
