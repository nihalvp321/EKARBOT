
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';

interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  rating: number;
  reviewText: string;
  date: string;
  salesAgent: string;
  verified: boolean;
}

interface ProjectStats {
  projectId: string;
  projectTitle: string;
  averageRating: number;
  totalReviews: number;
  assignedSalesAgents: number;
  status: string;
}

const ReviewsDashboard = () => {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      projectId: 'PROJ001',
      projectTitle: 'Sky View',
      customerName: 'John Doe',
      rating: 5,
      reviewText: 'Excellent project with great amenities and location.',
      date: '2025-01-15',
      salesAgent: 'Rahul',
      verified: true,
    },
    {
      id: '2',
      projectId: 'PROJ002',
      projectTitle: 'Marina Heights',
      customerName: 'Jane Smith',
      rating: 4,
      reviewText: 'Good value for money, professional team.',
      date: '2025-01-10',
      salesAgent: 'Raj',
      verified: true,
    },
  ]);

  const [projectStats] = useState<ProjectStats[]>([
    {
      projectId: 'PROJ001',
      projectTitle: 'Sky View',
      averageRating: 4.8,
      totalReviews: 15,
      assignedSalesAgents: 3,
      status: 'Active',
    },
    {
      projectId: 'PROJ002',
      projectTitle: 'Marina Heights',
      averageRating: 4.2,
      totalReviews: 8,
      assignedSalesAgents: 2,
      status: 'Active',
    },
  ]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const overallStats = {
    totalReviews: reviews.length,
    averageRating: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    totalProjects: projectStats.length,
    totalSalesAgents: projectStats.reduce((sum, project) => sum + project.assignedSalesAgents, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reviews Dashboard</h1>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalReviews}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overallStats.averageRating.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats.totalProjects}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales Agents</p>
                <p className="text-2xl font-bold text-purple-600">{overallStats.totalSalesAgents}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.map((project) => (
              <div key={project.projectId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{project.projectTitle}</h3>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {project.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(Math.round(project.averageRating))}</div>
                    <span className="font-medium">{project.averageRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span>{project.totalReviews} reviews</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{project.assignedSalesAgents} agents</span>
                  </div>
                  <div className="text-gray-600">ID: {project.projectId}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{review.customerName}</h4>
                    {review.verified && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {review.date}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{review.reviewText}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Project: {review.projectTitle}</span>
                  <span>Sales Agent: {review.salesAgent}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsDashboard;
