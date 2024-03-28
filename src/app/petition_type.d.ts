type petition = {
    petitionId: number,
    title: string,
    categoryId: number,
    ownerId: number,
    ownerFirstName: string,
    ownerLastName: string,
    numberOfSupporters: number,
    creationDate: string,
    supportingCost: number,
    description: string,
    moneyRaised: number,
    supportTiers: supportTier[]
}

type petitionSearchQuery = {
    startIndex: number,
    count: number,
    q: string,
    categoryIds: number[],
    supportingCost: number,
    ownerId: number,
    supporterId: number,
    sortBy: string
}

type petitionReturn = {
    petitions: petition[],
    count: number
}

type supportTier = {
    title: string,
    description: string,
    cost: number,
    supportTierId: number
}

type category = {
    categoryId: number,
    name: string
}

type supporter = {
    supportId: number,
    supportTierId: number,
    message: string,
    supporterId: number,
    supporterFirstName: string,
    supporterLastName: string,
    timestamp: string
}