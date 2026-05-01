import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useColors } from '@/lib/theme/colors';
import { useReviews, useReviewsAnalytics } from '@/lib/hooks/useReviews';
import type { Review } from '@/lib/api/reviews';

const RATING_FILTERS = [0, 5, 4, 3, 2, 1] as const;

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const colors = useColors();
  return (
    <View className="flex-row gap-[2px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          color={n <= rating ? colors.yellow : colors.separatorOpaque}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [ratingFilter, setRatingFilter] = useState(0);

  const { data: analytics, isLoading: analyticsLoading } =
    useReviewsAnalytics();
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useReviews(ratingFilter > 0 ? { rating: ratingFilter } : {});

  const reviews = data?.pages.flatMap((p) => p.reviews) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5">
        <Header title="Reviews" onBack={() => router.back()} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerClassName="px-5 pb-8"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Analytics card */}
            {analyticsLoading ? (
              <ActivityIndicator className="py-6" color={colors.tertiary} />
            ) : analytics ? (
              <Card elevated className="mb-lg">
                <View className="flex-row items-center gap-3 mb-4">
                  <Text className="text-[40px] font-extrabold text-ink tracking-[-1px]">
                    {(analytics.averageRating ?? 0).toFixed(1)}
                  </Text>
                  <View>
                    <Stars
                      rating={Math.round(analytics.averageRating ?? 0)}
                      size={16}
                    />
                    <Text className="text-[13px] text-tertiary mt-1">
                      {analytics.totalReviews} reviews
                    </Text>
                  </View>
                </View>

                {/* Rating bars */}
                {[5, 4, 3, 2, 1].map((star) => {
                  const item = analytics.ratingsBreakdown.find(
                    (b) => b.rating === star,
                  );
                  const pct = item?.percentage ?? 0;
                  return (
                    <View
                      key={star}
                      className="flex-row items-center gap-2 mb-[6px]"
                    >
                      <Text className="text-[12px] font-semibold text-tertiary w-3 text-right">
                        {star}
                      </Text>
                      <Icon name="star" size={10} color={colors.yellow} />
                      <View className="flex-1 h-[6px] rounded-full bg-separator-opaque overflow-hidden">
                        <View
                          className="h-full rounded-full bg-yellow"
                          style={{ width: `${pct}%` }}
                        />
                      </View>
                      <Text className="text-[11px] text-quaternary w-8 text-right">
                        {item?.count ?? 0}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            ) : null}

            {/* Filter pills */}
            <View className="flex-row gap-2 mb-lg flex-wrap">
              {RATING_FILTERS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRatingFilter(r)}
                  className={`px-4 py-[8px] rounded-full border-[1.5px] ${
                    ratingFilter === r
                      ? 'border-ink bg-ink'
                      : 'border-separator-opaque bg-surface'
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      ratingFilter === r ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {r === 0 ? 'All' : `${r} ★`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-12">
              <Icon name="star" size={36} color={colors.quaternary} />
              <Text className="text-[15px] text-tertiary mt-3">
                No reviews yet
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator className="py-4" color={colors.tertiary} />
          ) : isLoading ? (
            <ActivityIndicator className="py-8" color={colors.tertiary} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card elevated className="mb-3">
      <View className="flex-row items-center gap-3 mb-[10px]">
        <Avatar
          name={review.client.name}
          uri={review.client.profilePhotoUrl ?? undefined}
          size={36}
        />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-ink tracking-[-0.2px]">
            {review.client.name}
          </Text>
          <Text className="text-[12px] text-quaternary">
            {review.relativeTime}
          </Text>
        </View>
        <Stars rating={review.rating} />
      </View>
      {review.comment && (
        <Text className="text-[14px] text-secondary leading-[20px] tracking-[-0.1px]">
          {review.comment}
        </Text>
      )}
    </Card>
  );
}
