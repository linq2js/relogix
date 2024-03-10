# `relogix`

Relogix is designed to modularize React hook logic, allowing for shared hook results across components.

## Getting Started

This guide will help you get started with `relogix` by setting up a basic project structure and demonstrating how to use its core features.

### Step 1: Installation

First, you need to install `relogix` in your project. Open your terminal and run:

```bash
npm install relogix
```

or if you prefer using yarn:

```bash
yarn add relogix
```

### Step 2: Setup Provider

In your main application file (e.g., App.js), import the `Provider` from `relogix` and wrap your application component with it. This enables relogix functionality throughout your app.

```js
import React from "react";
import { Provider } from "relogix";
import App from "./App"; // Your main app component

const Root = () => (
  <Provider
    fallback={
      <div>
        This fallback will be shown when need hook logic starts fetching
      </div>
    }
  >
    <App />
  </Provider>
);

export default Root;
```

### Step 3: Using Logic Hooks

Now, you can create and use logic hooks within your components. For example, let's create a simple logic function:

```js
// logic/userLogic.js
export const UserLogic = () => {
  // Your hook logic here
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Fake API call to fetch user
    setTimeout(() => {
      setUser({ name: "John Doe", age: 30 });
    }, 1000);
  }, []);

  return user;
};
```

```js
// logic/counterLogic.js
export const CounterLogic = () => {
  const [count, setCount] = useState(0);

  return {
    count,
    increment() {
      setCount(count + 1);
    },
  };
};
```

### Step 4: Consuming Logic in Components

You can use the useLogic hook to consume the logic in your components:

```js
import React from "react";
import { useLogic } from "relogix";
import { UserLogic } from "./logic/userLogic";
import { CounterLogic } from "./logic/CounterLogic";

export const UserProfile = () => {
  const user = useLogic(UserLogic);

  if (!user) {
    return <div>Loading user...</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Age: {user.age}</p>
    </div>
  );
};

export const Counter = () => {
  const { count, increment } = useLogic(CounterLogic);

  return <h1 onClick={increment}>Count: {count}</h1>;
};
```

## Features

- Modularize and reuse React hook logic.
- Share hook results across components.
- Simplify logic management in large React applications.

## Advanced Usages

Relogix offers advanced features for optimizing your React applications, including support for lazy-loaded logic and re-rendering optimizations.

### Lazy-loaded Logic

Relogix supports lazy import of logic, allowing for more efficient code splitting and reduced initial load times. Use dynamic imports to define your logic:

```js
const LazyLogic = () => import("./logic/LazyLogic");
```

When using useLogic, Relogix will handle the lazy-loading seamlessly:

```js
const lazyLogicResult = useLogic(LazyLogic);
```

### Logic Depends on Other Logic

In relogix, you can easily compose and reuse logic by making one logic depend on another. This capability allows for modular and maintainable code, especially in complex applications where multiple pieces of logic might need to interact or share state.

#### Defining Dependent Logic

To define a piece of logic that depends on another, simply use the useLogic hook within your logic definition. This approach keeps your logic encapsulated and reusable.

```js
// Assuming you have a basic counter logic
const CounterLogic = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);

  return { count, increment };
};

// Define a new logic that depends on CounterLogic
const EnhancedCounterLogic = () => {
  const { count, increment } = useLogic(CounterLogic);

  const doubleCount = count * 2;

  return { count, doubleCount, increment };
};
```

In EnhancedCounterLogic, we reuse CounterLogic to keep the core functionality, and extend it with additional features, like doubleCount in this example.

#### Using Dependent Logic in Components

Using dependent logic in your components is as straightforward as using any other logic with useLogic.

```js
const CounterComponent = () => {
  const { count, doubleCount, increment } = useLogic(EnhancedCounterLogic);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double Count: {doubleCount}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};
```

#### Best Practices

When designing logic that depends on other logic, consider the following best practices to maintain clarity and prevent circular dependencies:

- **Encapsulation**: Keep logic self-contained and focused on a single responsibility. This makes it easier to compose and reuse.
- **Documentation**: Clearly document how your logic pieces interact and depend on each other. This will help maintain the codebase, especially as it grows.
- **Avoid Circular Dependencies**: Be mindful of creating logic that indirectly depends on itself through other logic. This can lead to infinite loops and unpredictable behavior.

By leveraging the capability to have logic depend on other logic, you can build a sophisticated yet organized system of reusable logic across your React application.

### Re-rendering Optimizations

Relogix provides several optimizations to minimize unnecessary re-renders, enhancing your application's performance.

#### Stable Callbacks

To prevent unnecessary re-renders, callbacks returned from a logic hook are stable. This means that even if the values within the logic state change, the callback reference remains the same, preventing child components from re-rendering if they depend solely on these callbacks.

For example, with a counter logic:

```js
const Counter = () => {
  const { count, increment } = useLogic(CounterLogic);

  return (
    <>
      <ButtonComp onClick={increment} />
      <h1>{count}</h1>
    </>
  );
};
```

In this case, the increment callback is stable. Despite changes in the count value, ButtonComp will not re-render, as the increment function's reference does not change.

These advanced features enable developers to write more efficient and performant React applications by leveraging lazy-loading and minimizing unnecessary re-renders.

## Testing

Testing your components and logic within relogix is straightforward and can be integrated into your existing testing setup. Here are some guidelines to effectively test your relogix-enabled components.

### Setup

Ensure your testing environment is set up to handle React components. Tools like Jest and React Testing Library are recommended for a comprehensive testing approach.

When testing components that use relogix logic, it's essential to wrap them in the Provider component to ensure the relogix context is available.

```jsx
import { renderHook, screen, act } from "@testing-library/react";
import { Provider } from "relogix";

const wrapper = (props) => (
  <Provider fallback={<div>loading</div>}>{props.children}</Provider>
);

const CounterLogic = () => {
  const [count, setCount] = useState(0);

  return {
    count,
    increment() {
      setCount(count + 1);
    },
  };
};

test("counter", async () => {
  const { result } = renderHook(() => useLogic(CounterLogic), { wrapper });
  // Initially, the logic must be loaded asynchronously.
  screen.getByText("loading");
  // wait logic loaded
  await act(async () => {});
  expect(result.current.count).toBe(0);
  // call hook methods
  act(() => result.current.increment());
  // because the update is async, must wait for an update
  await act(async () => {});
  expect(result.current.count).toBe(1);
});
```

## API Reference

### &lt;Provider/&gt; component

Wrap your application with the Provider to enable relogix functionality:

```js
import { Provider } from "relogix";

<Provider fallback={<LoadingComponent />} preload={[YourPreloadLogic]}>
  <App />
</Provider>;
```

- **fallback**: A React node displayed during logic preloading.
- **preload(optional)**: An array of logic functions to preload.

### useLogic() hook

Consume logic within your components:

```js
import { useLogic } from "relogix";

const yourComponentLogic = useLogic(YourLogic);
```

- **Single logic**: Returns the result of the logic function.
- **Multiple logics**: Pass an array of logic functions to receive an array of results.

```js
const [logicOneResult, logicTwoResult] = useLogic([LogicOne, LogicTwo]);
```

## Contributing

We welcome contributions to improve relogix. Please follow the contribution guidelines in the repository.

## License

Relogix is open-source and available under the MIT license.
