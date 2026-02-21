#!/usr/bin/env python
"""
Create sample presentation for Q4 2024 Patent Analytics Overview project
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import AnalyticsProject, AnalyticsPresentation
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def create_sample_presentation():
    # Find the Q4 2024 project or create one
    project = AnalyticsProject.objects.filter(name__icontains='Q4 2024').first()

    if not project:
        # Create the project if it doesn't exist
        user = User.objects.first()
        if not user:
            print("Error: No users found. Please create a user first.")
            return

        project = AnalyticsProject.objects.create(
            name="Q4 2024 Patent Analytics Overview",
            description="Comprehensive patent landscape analysis for Q4 2024",
            status="active",
            priority="high",
            created_by=user
        )
        print(f"Created project: {project.name}")
    else:
        print(f"Found existing project: {project.name}")

    # Get the user
    user = project.created_by

    # Create presentation with comprehensive slides
    presentation = AnalyticsPresentation.objects.create(
        project=project,
        name="Q4 2024 Patent Analytics Overview - Executive Summary",
        description="Executive presentation covering key findings from Q4 2024 patent landscape analysis",
        presentation_type="executive_summary",
        status="completed",
        theme="professional_blue",
        slide_count=15,
        duration_minutes=20,
        created_by=user,
        last_presented=timezone.now(),
        presentation_count=3,
        slides=[
            {
                "id": 1,
                "type": "title",
                "title": "Q4 2024 Patent Analytics Overview",
                "subtitle": "Executive Summary - Patent Landscape Analysis",
                "content": {
                    "presenter": "Patent Analytics Team",
                    "date": "December 2024"
                }
            },
            {
                "id": 2,
                "type": "content",
                "title": "Agenda",
                "content": {
                    "items": [
                        "Executive Summary",
                        "Patent Filing Trends",
                        "Technology Landscape",
                        "Competitive Intelligence",
                        "White Space Analysis",
                        "Key Recommendations"
                    ]
                }
            },
            {
                "id": 3,
                "type": "content",
                "title": "Executive Summary",
                "content": {
                    "highlights": [
                        "12,450 patents analyzed across 5 technology areas",
                        "35% increase in AI/ML patent filings YoY",
                        "3 major competitors identified with aggressive filing strategies",
                        "12 white space opportunities discovered",
                        "Recommended focus on quantum computing and edge AI"
                    ],
                    "metrics": {
                        "total_patents": "12,450",
                        "growth_rate": "+35%",
                        "competitors": "15",
                        "opportunities": "12"
                    }
                }
            },
            {
                "id": 4,
                "type": "chart",
                "title": "Patent Filing Trends (2020-2024)",
                "content": {
                    "chart_type": "line",
                    "data": {
                        "labels": ["2020", "2021", "2022", "2023", "2024"],
                        "datasets": [
                            {
                                "label": "AI/ML Patents",
                                "data": [850, 1200, 1800, 2500, 3375]
                            },
                            {
                                "label": "IoT Patents",
                                "data": [600, 750, 900, 1050, 1200]
                            },
                            {
                                "label": "Blockchain Patents",
                                "data": [200, 400, 550, 600, 550]
                            }
                        ]
                    },
                    "insights": [
                        "AI/ML patents show strongest growth trajectory",
                        "Blockchain filings plateauing in 2024",
                        "IoT maintains steady growth"
                    ]
                }
            },
            {
                "id": 5,
                "type": "content",
                "title": "Technology Landscape Overview",
                "content": {
                    "categories": [
                        {
                            "name": "Artificial Intelligence",
                            "patents": 3375,
                            "share": "27%",
                            "trend": "up"
                        },
                        {
                            "name": "Internet of Things",
                            "patents": 2800,
                            "share": "22%",
                            "trend": "stable"
                        },
                        {
                            "name": "Cloud Computing",
                            "patents": 2500,
                            "share": "20%",
                            "trend": "up"
                        },
                        {
                            "name": "5G Technology",
                            "patents": 2150,
                            "share": "17%",
                            "trend": "up"
                        },
                        {
                            "name": "Blockchain",
                            "patents": 1625,
                            "share": "13%",
                            "trend": "down"
                        }
                    ]
                }
            },
            {
                "id": 6,
                "type": "chart",
                "title": "Top 10 Patent Assignees",
                "content": {
                    "chart_type": "bar",
                    "data": {
                        "labels": ["IBM", "Microsoft", "Google", "Amazon", "Samsung", "Apple", "Huawei", "Intel", "Qualcomm", "Alibaba"],
                        "datasets": [
                            {
                                "label": "Patent Count",
                                "data": [1250, 1100, 980, 850, 780, 720, 680, 620, 580, 540]
                            }
                        ]
                    },
                    "insights": [
                        "IBM leads with 1,250 patents filed in 2024",
                        "Top 3 companies account for 25% of total filings",
                        "Asian companies showing increased activity"
                    ]
                }
            },
            {
                "id": 7,
                "type": "content",
                "title": "Competitive Intelligence - Key Players",
                "content": {
                    "competitors": [
                        {
                            "name": "IBM",
                            "strength": "High",
                            "focus_areas": ["AI/ML", "Quantum Computing", "Cloud"],
                            "filing_rate": "+18% YoY",
                            "threat_level": "High"
                        },
                        {
                            "name": "Microsoft",
                            "strength": "High",
                            "focus_areas": ["Cloud", "AI/ML", "Edge Computing"],
                            "filing_rate": "+22% YoY",
                            "threat_level": "High"
                        },
                        {
                            "name": "Google",
                            "strength": "High",
                            "focus_areas": ["AI/ML", "Autonomous Systems", "Healthcare AI"],
                            "filing_rate": "+28% YoY",
                            "threat_level": "Critical"
                        }
                    ]
                }
            },
            {
                "id": 8,
                "type": "chart",
                "title": "Geographic Distribution of Patents",
                "content": {
                    "chart_type": "map",
                    "data": {
                        "regions": [
                            {"country": "United States", "patents": 4850, "share": "39%"},
                            {"country": "China", "patents": 3100, "share": "25%"},
                            {"country": "Japan", "patents": 1550, "share": "12%"},
                            {"country": "South Korea", "patents": 1250, "share": "10%"},
                            {"country": "Germany", "patents": 875, "share": "7%"},
                            {"country": "Others", "patents": 825, "share": "7%"}
                        ]
                    },
                    "insights": [
                        "US maintains leadership with 39% of filings",
                        "China growing rapidly, now at 25%",
                        "Europe showing steady but moderate activity"
                    ]
                }
            },
            {
                "id": 9,
                "type": "content",
                "title": "White Space Analysis - Opportunities",
                "content": {
                    "opportunities": [
                        {
                            "area": "Quantum Machine Learning",
                            "potential": "High",
                            "competition": "Low",
                            "estimated_value": "$2.5B",
                            "recommendation": "Immediate action recommended"
                        },
                        {
                            "area": "Edge AI for Healthcare",
                            "potential": "High",
                            "competition": "Medium",
                            "estimated_value": "$1.8B",
                            "recommendation": "Strategic priority"
                        },
                        {
                            "area": "Privacy-Preserving ML",
                            "potential": "Medium",
                            "competition": "Low",
                            "estimated_value": "$1.2B",
                            "recommendation": "Consider for portfolio"
                        },
                        {
                            "area": "Sustainable Computing",
                            "potential": "Medium",
                            "competition": "Low",
                            "estimated_value": "$950M",
                            "recommendation": "Monitor and evaluate"
                        }
                    ]
                }
            },
            {
                "id": 10,
                "type": "chart",
                "title": "Patent Activity by Quarter",
                "content": {
                    "chart_type": "bar",
                    "data": {
                        "labels": ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"],
                        "datasets": [
                            {
                                "label": "Our Filings",
                                "data": [45, 52, 48, 55]
                            },
                            {
                                "label": "Competitor Average",
                                "data": [85, 92, 88, 95]
                            }
                        ]
                    },
                    "insights": [
                        "Our filing rate below competitor average",
                        "Q4 shows improvement with 55 filings",
                        "Need to accelerate filing strategy"
                    ]
                }
            },
            {
                "id": 11,
                "type": "content",
                "title": "Key Technology Trends",
                "content": {
                    "trends": [
                        {
                            "trend": "Generative AI",
                            "status": "Explosive Growth",
                            "impact": "Transformational",
                            "timeline": "Immediate",
                            "patents_2024": "+450%"
                        },
                        {
                            "trend": "Quantum Computing",
                            "status": "Emerging",
                            "impact": "High",
                            "timeline": "3-5 years",
                            "patents_2024": "+85%"
                        },
                        {
                            "trend": "Edge AI",
                            "status": "Growing",
                            "impact": "High",
                            "timeline": "1-2 years",
                            "patents_2024": "+62%"
                        },
                        {
                            "trend": "Neuromorphic Computing",
                            "status": "Early Stage",
                            "impact": "Medium",
                            "timeline": "5+ years",
                            "patents_2024": "+35%"
                        }
                    ]
                }
            },
            {
                "id": 12,
                "type": "content",
                "title": "Risk Assessment",
                "content": {
                    "risks": [
                        {
                            "risk": "Patent Infringement Exposure",
                            "level": "Medium",
                            "areas": ["Cloud orchestration", "ML model compression"],
                            "mitigation": "FTO analysis in progress"
                        },
                        {
                            "risk": "Competitor Patent Blocking",
                            "level": "High",
                            "areas": ["Federated learning", "Quantum algorithms"],
                            "mitigation": "Accelerate filing in critical areas"
                        },
                        {
                            "risk": "Technology Obsolescence",
                            "level": "Low",
                            "areas": ["Traditional blockchain"],
                            "mitigation": "Pivot to emerging areas"
                        }
                    ]
                }
            },
            {
                "id": 13,
                "type": "content",
                "title": "Strategic Recommendations",
                "content": {
                    "recommendations": [
                        {
                            "priority": "Critical",
                            "action": "Accelerate patent filings in Quantum ML and Edge AI",
                            "timeline": "Q1 2025",
                            "resources": "Increase IP budget by 30%",
                            "expected_outcome": "Secure 50+ patents in white space areas"
                        },
                        {
                            "priority": "High",
                            "action": "Conduct FTO analysis for cloud and ML technologies",
                            "timeline": "Q1-Q2 2025",
                            "resources": "External legal counsel",
                            "expected_outcome": "Identify and mitigate infringement risks"
                        },
                        {
                            "priority": "Medium",
                            "action": "Establish cross-licensing partnerships with key players",
                            "timeline": "Q2-Q3 2025",
                            "resources": "Business development team",
                            "expected_outcome": "Reduce litigation risk, access complementary tech"
                        },
                        {
                            "priority": "Medium",
                            "action": "Build defensive patent portfolio in core technologies",
                            "timeline": "Ongoing",
                            "resources": "R&D collaboration",
                            "expected_outcome": "Strengthen negotiating position"
                        }
                    ]
                }
            },
            {
                "id": 14,
                "type": "content",
                "title": "2025 Action Plan",
                "content": {
                    "timeline": [
                        {
                            "quarter": "Q1 2025",
                            "actions": [
                                "File 20+ patents in quantum ML",
                                "Complete FTO analysis",
                                "Hire 3 patent engineers"
                            ]
                        },
                        {
                            "quarter": "Q2 2025",
                            "actions": [
                                "Launch edge AI patent program",
                                "Initiate licensing discussions",
                                "Establish prior art database"
                            ]
                        },
                        {
                            "quarter": "Q3 2025",
                            "actions": [
                                "File 25+ patents in edge AI",
                                "Complete cross-licensing deals",
                                "Patent portfolio review"
                            ]
                        },
                        {
                            "quarter": "Q4 2025",
                            "actions": [
                                "Year-end portfolio assessment",
                                "2026 strategy planning",
                                "Competitive landscape update"
                            ]
                        }
                    ]
                }
            },
            {
                "id": 15,
                "type": "content",
                "title": "Conclusion & Next Steps",
                "content": {
                    "summary": [
                        "Strong growth in AI/ML patent landscape presents both opportunities and threats",
                        "Significant white space identified in quantum ML and edge AI",
                        "Competitor activity accelerating - immediate action required",
                        "Recommended 30% increase in IP investment for 2025"
                    ],
                    "next_steps": [
                        "Executive approval for budget increase",
                        "Kickoff quantum ML patent program",
                        "Schedule FTO analysis meetings",
                        "Monthly progress reviews starting January 2025"
                    ]
                }
            }
        ],
        speaker_notes={
            "1": "Welcome everyone. Today we'll review the comprehensive patent landscape analysis for Q4 2024.",
            "2": "Our agenda covers six key areas, focusing on actionable insights.",
            "3": "Key highlight: 35% YoY growth in AI/ML filings represents both opportunity and competitive threat.",
            "4": "Note the exponential growth in AI/ML patents - this is where the industry is moving.",
            "5": "AI leads at 27% share, but watch IoT and 5G as they're critical infrastructure.",
            "6": "IBM's dominance is notable, but Google's 28% growth rate is concerning.",
            "7": "Google represents our biggest competitive threat with aggressive AI filing strategy.",
            "8": "US still leads but China's 25% share is significant and growing.",
            "9": "These white space opportunities are time-sensitive - particularly quantum ML.",
            "10": "We're behind competitors in filing rate - need to close this gap.",
            "11": "Generative AI's 450% growth is unprecedented - game-changing technology.",
            "12": "Patent blocking risk in federated learning could limit our ML platform strategy.",
            "13": "Critical: We need executive approval for 30% budget increase to capitalize on opportunities.",
            "14": "Aggressive but achievable timeline - requires commitment and resources.",
            "15": "This is a pivotal moment. Our actions in next 6 months will determine our competitive position for years to come."
        },
        template_config={
            "layout": "professional",
            "font_family": "Segoe UI",
            "primary_color": "#0066CC",
            "secondary_color": "#00D9FF",
            "background": "white",
            "slide_numbers": True,
            "company_logo": True
        }
    )

    # Update slide count
    presentation.update_slide_count()
    presentation.save()

    print(f"\n✅ Successfully created presentation:")
    print(f"   ID: {presentation.id}")
    print(f"   Name: {presentation.name}")
    print(f"   Project: {presentation.project.name}")
    print(f"   Slides: {presentation.slide_count}")
    print(f"   Status: {presentation.status}")
    print(f"   Theme: {presentation.theme}")
    print(f"   Duration: {presentation.duration_minutes} minutes")
    print(f"   Presented: {presentation.presentation_count} times")
    print(f"\n🎉 Sample presentation created successfully!")
    print(f"\nView it at: http://localhost:3000/dashboard/analytics/projects/{project.id}?tab=presentations")

if __name__ == '__main__':
    create_sample_presentation()
