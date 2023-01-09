/*
  Created by Simone Scionti
*/

'use strict';

import { Request, Response } from "express";
import { Utils } from "../../../../shared/Utils/Utils";
import { DynamoDB, CognitoIdentityServiceProvider } from "aws-sdk";
import AWS = require("aws-sdk");
import { PromiseResult } from "aws-sdk/lib/request";
import { AuthorizationServiceUtils } from "../Utils/AuthorizationServiceUtils";


export async function getAuthorizedComponents(event: Request, res: Response) : Promise<void> {

    let dynamo = new DynamoDB.DocumentClient();
    let cognito = new CognitoIdentityServiceProvider({ signatureVersion: 'v4' });
    console.log(JSON.stringify(event))
    let groupName = await Utils.getUniqueInstance().getGroupFromSignature(event.headers.authorization, cognito);
    console.log("group: " + groupName);

    let dynamoParamsForNavigation = AuthorizationServiceUtils.paramsToGetNavigation(groupName, "TREO");
    let dynamoParamsForAPIs = AuthorizationServiceUtils.paramsForQueryByGroupName(groupName);

    console.log("paramsNav: " + dynamoParamsForNavigation);
    //GET
    console.log("paramsApis: " + dynamoParamsForAPIs);
    
    let dynamoDataGroups: PromiseResult<DynamoDB.DocumentClient.GetItemOutput, AWS.AWSError>;
    try {
        dynamoDataGroups = await dynamo.get(dynamoParamsForNavigation).promise();
    } catch (error) {
        res.status(500).send(Utils.getUniqueInstance().getErrorResponse(error, dynamoParamsForNavigation));
    }

    console.log("nav res: " + dynamoDataGroups);
    let dynamoDataAPIs: PromiseResult<DynamoDB.DocumentClient.QueryOutput, AWS.AWSError>;
    try {
        dynamoDataAPIs = await dynamo.query(dynamoParamsForAPIs).promise();
    } catch (error) {
        res.status(500).send(Utils.getUniqueInstance().getErrorResponse(error, dynamoParamsForAPIs));
    }

    console.log("apis res: " + dynamoDataAPIs);
    let navigationObject = dynamoDataGroups.Item ? dynamoDataGroups.Item.NavigationItems : {};

    console.log("navigation object  res: " + navigationObject);

    //Response
    const response = {
        Homepage: dynamoDataGroups.Item ? dynamoDataGroups.Item.Homepage : "",
        Navigation: navigationObject,
        Functionalities: dynamoDataAPIs.Items ? dynamoDataAPIs.Items : {}
    }
    res.status(200).send(Utils.getUniqueInstance().getDataResponse(response));
}