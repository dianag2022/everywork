// types/review.ts

export interface Review {
  id: string
  service_id: string
  reviewer_id: string
  rating: number // 1-5 stars
  title: string
  comment?: string
  images?: string[] // Array of image URLs
  verified: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewWithReviewer extends Review {
  reviewer: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

export interface CreateReviewData {
  service_id: string
  rating: number
  title: string
  comment?: string
  images?: string[]
}

export interface UpdateReviewData {
  rating?: number
  title?: string
  comment?: string
  images?: string[]
}

export interface ReviewVote {
  id: string
  review_id: string
  voter_id: string
  vote_type: 'helpful' | 'not_helpful'
  created_at: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export interface PaginatedReviews {
  status: string,
  data: ReviewWithReviewer[],
  pagination?: {
    current_page: number,
    total_count: number,
    has_more: boolean,
  },
  stats?: {
    average_rating?: number
    total_reviews: number
  }
}