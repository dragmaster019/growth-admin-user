export type Role = 'admin' | 'user'
export type Leg = 'ROOT' | 'LEFT' | 'MIDDLE' | 'RIGHT'

export interface User {
  _id: string
  name: string
  email: string
  Id: number | null
  points: number
  mobile: number | null
  parent: string
  referralCode: string
  referredBy: string
  position: Leg
  role: Role
  isFounder: boolean
  rank?: string
  rankKey?: string
  rankEmoji?: string
}

export interface LeaderboardEntry {
  _id: string
  name: string
  points: number
  referralCode: string
  role: Role
  isFounder: boolean
  rank?: string
  rankKey?: string
  rankEmoji?: string
  directCount: number
  rankPosition: number
  isMe: boolean
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  me: User & {
    directCount: number
    teamSize: number
    rankPosition: number
    nextRank: { key: string; name: string; min: number; color: string; emoji: string } | null
  }
  total: number
  pointValue: number
}

export type PayoutStatus = 'pending' | 'approved' | 'rejected'
export type PayoutMethod = 'upi' | 'bank' | 'paypal'

export interface PayoutRequest {
  _id: string
  userId: string
  name: string
  email: string
  amount: number
  method: PayoutMethod
  destination: string
  note: string
  status: PayoutStatus
  adminNote: string
  reviewedBy: string
  reviewedAt: string | null
  createdAt: string
}

export interface PayoutData {
  requests: PayoutRequest[]
  role: Role
  balance: number
  minPayout: number
  pendingCount: number
  pointValue: number
}

export interface Product {
  _id: string
  Product_name: string
  Price: number
  Quantity: number
  Description: string
  Image: string
}

export interface Txn {
  _id: string
  from: string
  to: string
  amount: number
  type: string
  createdAt: string
}

export interface TreeNode {
  _id: string
  name: string
  email: string
  referralCode: string
  position: Leg
  points: number
  role: Role
  isFounder: boolean
  children: TreeNode[]
}
