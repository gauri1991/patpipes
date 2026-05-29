"""
Patent Analytics Platform Backend URLs
Professional API routing configuration
"""

from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve

# API versioning
api_v1_patterns = [
    # Accounts domain
    path('accounts/', include('domains.accounts.urls', namespace='accounts-api')),

    # Projects domain
    path('', include('domains.projects.urls')),  # Remove the 'projects/' prefix here

    # Prior Art domain
    path('prior-art/', include('domains.prior_art.urls', namespace='prior-art-api')),

    # Workflows domain
    path('workflows/', include('domains.workflows.urls', namespace='workflows-api')),

    # Analytics domain
    path('analytics/', include('domains.analytics.urls', namespace='analytics-api')),

    # Patents domain
    path('patents/', include('domains.patents.urls', namespace='patents-api')),

    # Prosecution domain
    path('prosecution/', include('domains.prosecution.urls', namespace='prosecution-api')),

    # Infringement domain
    path('infringement/', include('domains.infringement.urls', namespace='infringement-api')),

    # Attorney Network domain
    path('attorney/', include('domains.attorney.urls', namespace='attorney-api')),

    # Collaboration domain
    path('collaboration/', include('domains.collaboration.urls', namespace='collaboration-api')),

    # Help & documentation domain
    path('help/', include('domains.help.urls', namespace='help-api')),

    # Web Search domain
    path('web-search/', include('domains.web_search.urls', namespace='web_search')),

    # FCC Data domain
    path('fcc/', include('domains.fcc_data.urls', namespace='fcc_data')),

    # Document Download domain
    path('doc-download/', include('domains.doc_download.urls', namespace='doc_download')),
]

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/v1/', include(api_v1_patterns)),
    
    # Health check at root
    path('health/', include('domains.accounts.urls', namespace='health')),
]

# Serve media files.
# In production there is no nginx in front of gunicorn (see docker-compose.yml),
# so Django itself must serve user-uploaded media — otherwise /media/* 404s and
# evidence PDFs/screenshots fail to load. django.views.static.serve handles this
# regardless of DEBUG. (Static assets still go through collectstatic; serve them
# here too as a fallback when DEBUG is off.)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
        re_path(r'^static/(?P<path>.*)$', static_serve, {'document_root': settings.STATIC_ROOT}),
    ]
