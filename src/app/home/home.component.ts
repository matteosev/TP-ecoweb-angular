import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { provideComponentStore } from '@ngrx/component-store';
import { DEFAULT_LIMIT } from '../shared/constants';
import { AuthStore } from '../shared/store';
import { ArticleListComponent } from '../shared/ui/article-list';
import { PaginationComponent } from '../shared/ui/pagination';
import { FEED_TYPE, FeedType, HomeStore } from './home.store';
import { FeedToggleComponent } from './ui/feed-toggle/feed-toggle.component';
import { TagsComponent } from './ui/tags/tags.component';
import { Article } from '../shared/models';
import { interval, Subscription, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-home',
    imports: [
        TagsComponent,
        FeedToggleComponent,
        NgIf,
        ArticleListComponent,
        PaginationComponent,
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideComponentStore(HomeStore)]
})
export default class HomeComponent implements OnInit {
  readonly #homeStore = inject(HomeStore);
  readonly #authStore = inject(AuthStore);
  readonly articleCount = this.#homeStore.selectors.articleCount;
  readonly currentOffset = this.#homeStore.selectors.currentOffset;
  readonly isAuthenticated = this.#authStore.selectors.isAuthenticated;
  readonly articleList = this.#homeStore.selectors.articleList;
  
  private apiSub: Subscription | undefined;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.toggleFeed(FEED_TYPE.yourFeed);
    } else {
      this.toggleFeed(FEED_TYPE.globalFeed);
    }

    this.apiSub = interval(10000).pipe(
      switchMap(() => this.http.get<any>('http://api.quotable.io/random'))
    ).subscribe(
      (data) => {
        alert(`Résultat de l'API :\n${data.content}`);
      },
      (error) => {
        console.error('Erreur API', error);
      }
    );
  }

  ngOnDestroy() {
    if (this.apiSub) {
      this.apiSub.unsubscribe();
    }
  }

  selectTag(tag: string): void {
    this.#homeStore.queryArticle({
      feedType: FEED_TYPE.tagFeed,
      params: {
        limit: DEFAULT_LIMIT,
        offset: 0,
        tag,
      },
    });
  }

  toggleFeed(feedType: FeedType): void {
    this.#homeStore.queryArticle({
      feedType,
      params: {
        limit: DEFAULT_LIMIT,
        offset: 0,
      },
    });
  }

  onPageOffsetChange(offset: number): void {
    this.#homeStore.onOffsetChange(offset);
  }

  toggleFavorite(article: Article): void {
    this.#homeStore.toggleFavorite(article);
  }

  clicCount: number = 0;

  incrementClicks() {
    this.clicCount++;
  }

  ngOninit(){
    this.createAnnoyingOverlay() ;
  }

  createAnnoyingOverlay() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 200; i++) {
    const p = document.createElement('div');
    p.className = 'heavy-particle';
    // Position aléatoire initiale
    let x = Math.random() * window.innerWidth;
    let y = Math.random() * window.innerHeight;
    let dx = (Math.random() - 0.5) * 5;
    let dy = (Math.random() - 0.5) * 5;

    container.appendChild(p);

    // Boucle d'animation haute fréquence
    const update = () => {
      x += dx;
      y += dy;

      if (x < 0 || x > window.innerWidth) dx *= -1;
      if (y < 0 || y > window.innerHeight) dy *= -1;

      // Utilisation de transform pour forcer le GPU, 
      // mais avec des filtres pour le ralentir
      p.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${x % 360}deg)`;
      requestAnimationFrame(update);
    };
    update();
  }
}
}
