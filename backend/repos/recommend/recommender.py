from repos.recommend.__season_recommender import (
    init as season_recommender_init,
    term as season_recommender_term,
    recommend_fertilizer as recommend_season_fertilizer
)
from repos.recommend.__subfield_recommender import (
    init as subfield_recommender_init,
    term as subfield_recommender_term,
    recommend_fertilizer as recommend_subfield_fertilizer
)


def init():
    season_recommender_init()
    subfield_recommender_init()


def term():
    season_recommender_term()
    subfield_recommender_term()
