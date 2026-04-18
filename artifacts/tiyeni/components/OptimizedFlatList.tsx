import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList as RNFlatList,
  FlatListProps,
  ListRenderItem,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'getItemLayout'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  itemWidth?: number;
  numColumns?: number;
  enableOptimizations?: boolean;
  estimatedItemSize?: number;
}

// Constants for performance
const DEFAULT_ITEM_HEIGHT = 80;
const DEFAULT_ITEM_WIDTH = 350;
const MAX_TO_RENDER_PER_BATCH = 10;
const WINDOW_SIZE = 10;
const INITIAL_NUM_TO_RENDER = 15;
const REMOVAL_BEHAVIOR = 'unmount' as const;

export function OptimizedFlatList<T>({
  data,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  itemWidth = DEFAULT_ITEM_WIDTH,
  numColumns = 1,
  enableOptimizations = true,
  estimatedItemSize = DEFAULT_ITEM_HEIGHT,
  ...props
}: OptimizedFlatListProps<T>) {
  // Memoize key extractor
  const keyExtractor = useCallback((item: T, index: number) => {
    // Try to use item.id, fallback to index
    if (item && typeof item === 'object' && 'id' in item) {
      return String(item.id);
    }
    return `item-${index}`;
  }, []);

  // Memoize getItemLayout for better performance
  const getItemLayout = useMemo(() => {
    if (!enableOptimizations) return undefined;

    return (data: any, index: number) => {
      const length = numColumns === 1 ? itemHeight : itemHeight;
      const offset = numColumns === 1 
        ? index * itemHeight 
        : Math.floor(index / numColumns) * itemHeight;
      
      return {
        length,
        offset,
        index,
      };
    };
  }, [itemHeight, numColumns, enableOptimizations]);

  // Memoize content container style
  const contentContainerStyle = useMemo(() => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: 16,
      paddingVertical: 8,
    };

    if (numColumns > 1) {
      baseStyle.flexDirection = 'row';
      baseStyle.flexWrap = 'wrap';
      baseStyle.justifyContent = 'space-between';
    }

    return baseStyle;
  }, [numColumns]);

  // Memoized render item with performance optimizations
  const memoizedRenderItem = useCallback(renderItem, [renderItem]);

  // Performance-optimized props
  const optimizedProps: FlatListProps<T> = {
    data,
    renderItem: memoizedRenderItem,
    keyExtractor,
    contentContainerStyle,
    ...props,
  };

  // Add performance optimizations if enabled
  if (enableOptimizations) {
    if (getItemLayout) {
      optimizedProps.getItemLayout = getItemLayout;
    }

    // Optimize for large lists
    optimizedProps.maxToRenderPerBatch = MAX_TO_RENDER_PER_BATCH;
    optimizedProps.windowSize = WINDOW_SIZE;
    optimizedProps.initialNumToRender = INITIAL_NUM_TO_RENDER;
    optimizedProps.removeClippedSubviews = true;
    optimizedProps.updateCellsBatchingPeriod = 50; // Faster updates
    
    // Platform-specific optimizations
    if (Platform.OS === 'android') {
      optimizedProps.numColumns = numColumns;
    }

    // Memory management (removalBehavior not supported in React Native FlatList)
    // optimizedProps.removalBehavior = REMOVAL_BEHAVIOR;
  }

  return <RNFlatList {...optimizedProps} />;
}

// Memoized component for better performance
export const MemoizedOptimizedFlatList = memo(OptimizedFlatList) as typeof OptimizedFlatList;

// HOC for adding performance optimizations to existing FlatLists
export function withOptimizations<T>(WrappedComponent: React.ComponentType<FlatListProps<T>>) {
  return memo(function OptimizedWrapper(props: FlatListProps<T>) {
    const { data, renderItem, ...restProps } = props;
    
    // Ensure data is an array
    const safeData = data ? Array.from(data) : [];
    
    // Ensure renderItem is provided
    if (!renderItem) {
      console.warn('renderItem is required for FlatList');
      return null;
    }
    
    return (
      <OptimizedFlatList
        data={safeData}
        renderItem={renderItem}
        {...restProps}
        enableOptimizations={true}
      />
    );
  });
}

// Specialized list components for common use cases

export function TripList({ trips, ...props }: { trips: any[] } & Omit<OptimizedFlatListProps<any>, 'data'>) {
  return (
    <OptimizedFlatList
      data={trips}
      itemHeight={120}
      enableOptimizations={true}
      estimatedItemSize={120}
      {...props}
    />
  );
}

export function MessageList({ messages, ...props }: { messages: any[] } & Omit<OptimizedFlatListProps<any>, 'data'>) {
  return (
    <OptimizedFlatList
      data={messages}
      itemHeight={60}
      enableOptimizations={true}
      estimatedItemSize={60}
      inverted={true}
      {...props}
    />
  );
}

export function NotificationList({ notifications, ...props }: { notifications: any[] } & Omit<OptimizedFlatListProps<any>, 'data'>) {
  return (
    <OptimizedFlatList
      data={notifications}
      itemHeight={80}
      enableOptimizations={true}
      estimatedItemSize={80}
      {...props}
    />
  );
}

export function GridList<T>({ data, ...props }: { data: T[] } & Omit<OptimizedFlatListProps<T>, 'data' | 'numColumns'>) {
  return (
    <OptimizedFlatList
      data={data}
      numColumns={2}
      itemHeight={150}
      itemWidth={150}
      enableOptimizations={true}
      estimatedItemSize={150}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
