
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RAGProject {
  project_id: string;
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  relevance_score: number;
  reasoning: string;
}

interface RAGSearchResult {
  query: string;
  total: number;
  projects: RAGProject[];
}

export const useRAGSearch = () => {
  const [isSearching, setIsSearching] = useState(false);

  const performRAGSearch = async (query: string): Promise<RAGSearchResult> => {
    setIsSearching(true);
    
    try {
      // In a real implementation, this would call your n8n workflow
      // For now, we'll simulate the RAG search with mock data
      
      // Step 1: Fetch all active projects from database
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Failed to fetch projects');
      }

      // Step 2: Simulate RAG processing (this would be done by your n8n workflow)
      const processedProjects = await simulateRAGProcessing(projects, query);

      return {
        query,
        total: processedProjects.length,
        projects: processedProjects
      };
    } catch (error) {
      console.error('RAG search error:', error);
      toast.error('Failed to perform intelligent search');
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  const simulateRAGProcessing = async (projects: any[], query: string): Promise<RAGProject[]> => {
    // This simulates the RAG processing that would happen in n8n
    // In reality, this would involve:
    // 1. Vector embeddings of the query
    // 2. Similarity search against project embeddings
    // 3. LLM reasoning for match explanation
    
    const queryLower = query.toLowerCase();
    
    const scoredProjects = projects.map(project => {
      let relevanceScore = 0;
      const reasons: string[] = [];

      // Location matching
      if (queryLower.includes(project.emirate?.toLowerCase()) || 
          queryLower.includes(project.region_area?.toLowerCase())) {
        relevanceScore += 25;
        reasons.push(`Location match: Found in ${project.emirate} - ${project.region_area}`);
      }

      // Property type matching
      if (queryLower.includes(project.project_type?.toLowerCase())) {
        relevanceScore += 20;
        reasons.push(`Property type: ${project.project_type} matches your search`);
      }

      // Status matching
      if (queryLower.includes('ready') && project.project_status === 'Ready') {
        relevanceScore += 15;
        reasons.push('Project status: Ready for immediate move-in');
      } else if (queryLower.includes('off plan') && project.project_status === 'Planning') {
        relevanceScore += 15;
        reasons.push('Project status: Off-plan investment opportunity');
      }

      // Developer reputation (simulated)
      const reputableDevelopers = ['Emaar', 'Damac', 'Nakheel', 'Dubai Properties'];
      if (reputableDevelopers.some(dev => project.developer_name?.includes(dev))) {
        relevanceScore += 10;
        reasons.push(`Reputable developer: ${project.developer_name}`);
      }

      // Budget keywords (simulated)
      if (queryLower.includes('luxury') || queryLower.includes('premium')) {
        relevanceScore += 10;
        reasons.push('Premium property category');
      } else if (queryLower.includes('affordable') || queryLower.includes('budget')) {
        relevanceScore += 8;
        reasons.push('Budget-friendly option');
      }

      // Text similarity (very basic simulation)
      const descriptionWords = project.description?.toLowerCase().split(' ') || [];
      const queryWords = queryLower.split(' ');
      const commonWords = queryWords.filter(word => 
        word.length > 3 && descriptionWords.some(desc => desc.includes(word))
      );
      
      if (commonWords.length > 0) {
        relevanceScore += commonWords.length * 5;
        reasons.push(`Description relevance: ${commonWords.length} matching criteria found`);
      }

      // Add some randomness to simulate real RAG scoring
      relevanceScore += Math.random() * 10;

      // Ensure minimum reasoning
      if (reasons.length === 0) {
        reasons.push('General property match based on search criteria');
      }

      return {
        project_id: project.project_id,
        project_title: project.project_title,
        developer_name: project.developer_name,
        emirate: project.emirate,
        region_area: project.region_area,
        project_type: project.project_type,
        description: project.description,
        relevance_score: Math.min(Math.round(relevanceScore), 99), // Cap at 99%
        reasoning: reasons.slice(0, 3).join('; ') // Limit to top 3 reasons
      };
    });

    // Sort by relevance score and return top matches
    return scoredProjects
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .filter(project => project.relevance_score > 5); // Filter out very low relevance
  };

  return {
    performRAGSearch,
    isSearching
  };
};
