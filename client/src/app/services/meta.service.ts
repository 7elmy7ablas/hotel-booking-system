import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  updateTitle(title: string): void {
    this.titleService.setTitle(title);
  }

  updateMetaTags(config: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  }): void {
    if (config.title) {
      this.titleService.setTitle(config.title);
      this.metaService.updateTag({ property: 'og:title', content: config.title });
      this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    }

    if (config.description) {
      this.metaService.updateTag({ name: 'description', content: config.description });
      this.metaService.updateTag({ property: 'og:description', content: config.description });
      this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    }

    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
    }

    if (config.url) {
      this.metaService.updateTag({ property: 'og:url', content: config.url });
    }

    // Set default Open Graph type
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
  }
}
