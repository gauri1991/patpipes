import os
import sys
import django

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from services.models import ServiceCategory, Service

# EpochServe Service Categories and Services
epochserve_data = {
    "IP Lifecycle Advisory": [
        {
            "name": "Prior Art Search",
            "slug": "prior-art-search",
            "short_description": "Comprehensive prior art searches to assess patentability and novelty of inventions.",
            "description": """Our Prior Art Search service provides thorough research and analysis to identify existing patents, publications, and other prior art relevant to your invention. This helps assess patentability before filing and strengthens patent applications.

We conduct searches across multiple databases including patent offices worldwide, scientific journals, technical publications, and non-patent literature. Our experienced analysts provide detailed reports with relevance rankings and analysis.

This service is essential for determining if an invention is novel and non-obvious, helping you make informed decisions about patent filing and prosecution strategy."""
        },
        {
            "name": "Patent Drafting",
            "slug": "patent-drafting",
            "short_description": "Professional patent drafting services for provisional and non-provisional applications.",
            "description": """Our Patent Drafting service provides expert preparation of patent applications that maximize protection while meeting all legal requirements. We work closely with inventors to understand the invention and craft strong patent claims.

Our team of technical experts and patent professionals draft clear, comprehensive specifications with well-structured claims that provide broad protection. We handle both provisional and non-provisional applications across all technology domains.

We ensure your patent application is technically accurate, legally sound, and strategically positioned to secure the broadest possible protection for your innovation."""
        },
        {
            "name": "Prosecution Support",
            "slug": "prosecution-support",
            "short_description": "Expert support for patent prosecution and responding to office actions.",
            "description": """Our Prosecution Support service assists patent attorneys and in-house counsel throughout the patent prosecution process. We provide technical analysis, prior art research, and strategic guidance for responding to office actions.

We help analyze rejections, identify distinguishing features, conduct supplemental searches, and develop arguments to overcome objections. Our support enhances the quality of responses while reducing costs and improving grant rates.

This service ensures your patent applications navigate prosecution successfully with strong, enforceable claims."""
        },
        {
            "name": "Litigation Support",
            "slug": "litigation-support",
            "short_description": "Comprehensive litigation support including claim charts, invalidity searches, and expert analysis.",
            "description": """Our Litigation Support service provides technical and analytical support for patent litigation matters. We prepare detailed claim charts, conduct invalidity searches, analyze prior art, and provide expert technical analysis.

Our team assists with evidence of use (EoU) analysis, infringement assessments, and patent invalidity studies for IPR, re-exam, and litigation proceedings. We deliver clear, well-documented reports that support legal arguments.

This service helps legal teams build strong cases with technically sound analysis and comprehensive documentation."""
        }
    ],
    "IP Intelligence": [
        {
            "name": "Patent Analytics",
            "slug": "patent-analytics",
            "short_description": "Advanced patent analytics and portfolio analysis to drive IP strategy.",
            "description": """Our Patent Analytics service leverages data science and domain expertise to extract actionable insights from patent data. We analyze patent portfolios, technology trends, and competitive landscapes to inform strategic decisions.

We provide portfolio quality assessments, technology mapping, citation analysis, and forward-looking trend identification. Our analytics help identify white space opportunities, assess patent strength, and guide R&D investments.

This service transforms patent data into strategic intelligence that drives innovation and competitive advantage."""
        },
        {
            "name": "Technology Landscaping",
            "slug": "technology-landscaping",
            "short_description": "Comprehensive technology landscape analysis to identify trends and opportunities.",
            "description": """Our Technology Landscaping service provides comprehensive analysis of patent and technical literature to map technology domains. We identify key players, emerging trends, technology evolution, and white space opportunities.

We deliver visual landscape maps, trend analysis, and strategic insights that inform R&D planning, M&A decisions, and technology investments. Our reports highlight opportunities for innovation and competitive positioning.

This service provides the intelligence needed to make informed strategic decisions about technology development and market entry."""
        },
        {
            "name": "Technology Transfer",
            "slug": "technology-transfer",
            "short_description": "Strategic support for technology transfer, licensing, and commercialization.",
            "description": """Our Technology Transfer service supports universities, research institutions, and companies in commercializing innovations. We provide market research, partner scouting, valuation support, and licensing strategy.

We identify potential licensees, assess market opportunities, conduct competitive analysis, and support technology marketing efforts. Our service bridges the gap between innovation and commercialization.

This service maximizes the value of your intellectual property through strategic partnerships and licensing opportunities."""
        },
        {
            "name": "Patent Valuation",
            "slug": "patent-valuation",
            "short_description": "Professional patent valuation for licensing, transactions, and portfolio management.",
            "description": """Our Patent Valuation service provides objective, data-driven assessments of patent value for licensing negotiations, transactions, and portfolio management. We use multiple valuation methodologies tailored to your needs.

We analyze technical merit, market potential, competitive position, and legal strength to determine patent value. Our valuations support licensing negotiations, M&A transactions, portfolio optimization, and financial reporting.

This service ensures you have credible, defensible valuations that support strategic and financial decisions."""
        }
    ],
    "Market Intelligence": [
        {
            "name": "New Geography to Target",
            "slug": "new-geography-to-target",
            "short_description": "Market intelligence to identify promising new geographic markets for expansion.",
            "description": """Our New Geography to Target service helps companies identify and evaluate geographic markets for expansion. We analyze patent activity, market trends, regulatory environments, and competitive landscapes.

We provide insights into market size, growth potential, competitive intensity, IP landscape, and market entry barriers. Our analysis supports strategic decisions about geographic expansion and resource allocation.

This service helps you identify the most promising markets for growth and develop strategies for successful market entry."""
        },
        {
            "name": "Competitor Insights",
            "slug": "competitor-insights",
            "short_description": "Deep competitive intelligence based on patent and market analysis.",
            "description": """Our Competitor Insights service provides comprehensive analysis of competitor innovation strategies, patent portfolios, and technology focus areas. We track competitor R&D activity and identify strategic shifts.

We analyze patent filings, technical publications, partnerships, and product developments to reveal competitor strategies. Our insights help you anticipate competitive moves and identify opportunities.

This service keeps you informed about competitive dynamics and helps you maintain strategic advantage."""
        },
        {
            "name": "Competitive Benchmarking",
            "slug": "competitive-benchmarking",
            "short_description": "Benchmark your IP position against competitors and industry leaders.",
            "description": """Our Competitive Benchmarking service compares your patent portfolio and innovation metrics against competitors and industry benchmarks. We assess portfolio quality, technology coverage, and innovation velocity.

We provide detailed comparisons of patent quality metrics, technology areas, geographic coverage, and citation patterns. Our benchmarking identifies strengths, gaps, and opportunities for improvement.

This service helps you understand your competitive position and develop strategies to strengthen your IP portfolio."""
        }
    ],
    "Illustrations": [
        {
            "name": "Design Drawings",
            "slug": "design-drawings",
            "short_description": "Professional patent design drawings that meet all USPTO requirements.",
            "description": """Our Design Drawings service provides high-quality illustrations for design patent applications. We create precise drawings that clearly show ornamental features while meeting all USPTO requirements.

Our skilled illustrators work from photographs, CAD files, or physical samples to create multiple views showing all aspects of the design. We ensure compliance with patent office standards for line weight, shading, and format.

This service ensures your design patent application has clear, professional drawings that support strong protection."""
        },
        {
            "name": "Utility Drawings",
            "slug": "utility-drawings",
            "short_description": "Technical patent drawings for utility applications across all technologies.",
            "description": """Our Utility Drawings service creates precise technical illustrations for utility patent applications. We work across all technology domains to create clear drawings that support patent claims.

We convert rough sketches, photos, CAD files, or descriptions into formal patent drawings that meet USPTO and international standards. Our drawings clearly show all elements referenced in claims and specifications.

This service ensures your utility patent has professional drawings that enhance understanding and support patent prosecution."""
        },
        {
            "name": "PCT Drawings",
            "slug": "pct-drawings",
            "short_description": "International patent drawings meeting PCT and foreign filing requirements.",
            "description": """Our PCT Drawings service creates patent illustrations that meet requirements for international patent applications under the Patent Cooperation Treaty (PCT) and foreign patent offices.

We ensure drawings comply with WIPO standards and requirements of major patent offices worldwide. We handle format conversions, relabeling, and modifications needed for different jurisdictions.

This service simplifies international patent filing with drawings that meet all regional requirements."""
        },
        {
            "name": "Technical Drawings",
            "slug": "technical-drawings",
            "short_description": "Detailed technical illustrations for complex inventions and systems.",
            "description": """Our Technical Drawings service creates detailed illustrations for complex technical inventions, systems, and processes. We specialize in mechanical, electrical, and software inventions.

We create exploded views, cross-sections, flow diagrams, and system architectures that clearly communicate technical concepts. Our drawings enhance patent specifications and support prosecution.

This service ensures even the most complex inventions are clearly illustrated for patent applications and technical documentation."""
        },
        {
            "name": "Flow Charts",
            "slug": "flow-charts",
            "short_description": "Process and method flow charts for software and business method patents.",
            "description": """Our Flow Charts service creates clear, professional flow diagrams for software, business methods, and process patent applications. We illustrate algorithms, workflows, and process steps.

We create flow charts that comply with patent office requirements while clearly showing process logic, decision points, and data flow. Our diagrams support claims and enhance patent specifications.

This service ensures your method and process patents have clear visual representations that support strong protection."""
        }
    ]
}

def add_services():
    print("Adding EpochServe services to database...")

    for category_name, services in epochserve_data.items():
        # Get or create category
        category, created = ServiceCategory.objects.get_or_create(
            name=category_name,
            defaults={
                'description': f'{category_name} services for comprehensive IP support.',
                'icon': 'icon-stack'  # Default icon, can be updated
            }
        )

        if created:
            print(f"\n✓ Created category: {category_name}")
        else:
            print(f"\n✓ Category exists: {category_name}")

        # Add services
        for service_data in services:
            service, created = Service.objects.get_or_create(
                slug=service_data['slug'],
                defaults={
                    'name': service_data['name'],
                    'short_description': service_data['short_description'],
                    'description': service_data['description'],
                    'category': category,
                    'is_featured': False
                }
            )

            if created:
                print(f"  ✓ Added service: {service_data['name']}")
            else:
                # Update existing service
                service.name = service_data['name']
                service.short_description = service_data['short_description']
                service.description = service_data['description']
                service.category = category
                service.save()
                print(f"  ✓ Updated service: {service_data['name']}")

    print("\n" + "="*60)
    print("Summary:")
    print(f"Total categories: {ServiceCategory.objects.count()}")
    print(f"Total services: {Service.objects.count()}")
    print("="*60)

if __name__ == '__main__':
    add_services()
