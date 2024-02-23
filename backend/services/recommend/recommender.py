from services.recommend import __season_recommender
from services.recommend import __subfield_recommender


def init():
    __season_recommender.init()
    __subfield_recommender.init()


def term():
    __season_recommender.term()
    __subfield_recommender.term()


recommend_season_fertilizer = __season_recommender.recommend_fertilizer
recommend_subfield_fertilizer = __subfield_recommender.recommend_fertilizer
