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
        This fallback message will appear while the required hooks are loading
      </div>
    }
  >
    <App />
  </Provider>
);

export default Root;
```

### Step 3: Defining Logic

Now, you can define your logics. For example, let's create a simple logic function:

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

### Compare to other state management libs

| Feature/Aspect  | Redux                                                                                  | Constate                                                                                       | use-between                                                                              | Relogix                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Complexity**  | High, involves understanding actions, reducers, and middleware.                        | Low to Medium, simplifies context API usage for state management.                              | Very Low, straightforward state sharing between components.                              | `Low, focuses on modularizing React hook logic for reuse.`                                                              |
| **Boilerplate** | High, requires a lot of setup including actions, reducers, and potentially middleware. | Low, reduces boilerplate by leveraging React context and hooks.                                | Very Low, minimal setup required for sharing state.                                      | `Low, minimal boilerplate by focusing on logic reuse without extensive setup.`                                          |
| **Performance** | Good, especially with optimizations and careful state management.                      | Good, optimized by minimizing the number of re-renders.                                        | Good for small to medium projects, simple model reduces over-rendering.                  | `Optimized for re-rendering with features like stable callbacks and potential for lazy loading logic.`                  |
| **Use Case**    | Best suited for complex, large-scale applications with global state management needs.  | Suitable for applications that prefer a more React-centric state management using Context API. | Ideal for simpler applications or components that need to share state straightforwardly. | `Well-suited for React applications aiming to share and reuse hook logic across components, enhancing maintainability.` |

## Advanced Usages

Relogix offers advanced features for optimizing your React applications, including support for lazy-loaded logic and re-rendering optimizations.

### Preloading Logic

Relogix enhances your application's performance by loading logic asynchronously by default. However, you can take control of the logic loading process, particularly to preload certain logic that your application needs immediately upon launch. This feature is especially useful for improving the initial render performance and user experience.

#### How to Preload Logic

To preload your logic with Relogix, you pass the logics you want to preload to the Provider component via the preload prop. This ensures that the specified logics are loaded and ready to use as soon as your application starts, reducing loading times and improving responsiveness.

#### Example

Consider you have two logic hooks, AuthLogic and UserDataLogic, that you want to preload:

```js
import { Provider } from "relogix";
import AuthLogic from "./logic/AuthLogic";
import UserDataLogic from "./logic/UserDataLogic";

// In your App component or main entry file
<Provider fallback={<div>Loading...</div>} preload={[AuthLogic, UserDataLogic]}>
  <App />
</Provider>;
```

In this setup, AuthLogic and UserDataLogic are preloaded when the application initializes, ensuring that these pieces of logic are immediately available for any component that needs them. No loading fallback display as usual.

#### Benefits of Preloading Logic

- **Improved Initial Load Performance**: By preloading critical logic, you can significantly reduce the initial loading time of your application.
- **Enhanced User Experience**: Preloading logic minimizes the perceived waiting time for users, leading to a smoother and more responsive user experience.
- **Strategic Resource Loading**: Gives you control over the loading strategy, allowing you to prioritize essential logic that needs to be available as soon as possible.

Preloading logic with Relogix is a powerful feature for optimizing your React application's loading performance and user experience. By strategically preloading essential logic, you ensure that your application is responsive and ready to provide value to your users from the moment it loads.

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
const CounterLogic = () => {
  const [count, setCount] = useState(0);

  return {
    count,
    increment() {
      setCount(count + 1);
    },
    showInfo() {
      alert(count);
    },
  };
};

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

In this scenario, it is common practice to utilize a memorized callback to enhance performance through the `useCallback` hook.

```js
const CounterLogic = () => {
  const [count, setCount] = useState(0);
  // We can access the previous state value, allowing the memorized callback to avoid directly referencing the count variable.
  const increment = useCallback(() => setCount((prev) => prev + 1), [setCount]);
  // However, the `showInfo` function will be recreated when the count variable changes.
  const showInfo = useCallback(() => alert(count), [count]);
  // Alternatively, we can create a ref for the count value and use it within the `showInfo` callback to prevent unnecessary recreations.
  const countRef = useRef(count);
  countRef.current = count;
  const showInfo = useCallback(() => alert(countRef.current), []);

  return {
    count,
    increment,
    showInfo,
  };
};
```

With `relogix`, the `increment`, 'showInfo' callbacks are stable. Despite changes in the `count` value, ButtonComp will not re-render, as the `increment` function's reference does not change.

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
