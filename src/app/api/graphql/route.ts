import { createSchema, createYoga } from "graphql-yoga";
import { createOrder, getOrdersByEmail } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/storefront-data";

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Product {
      id: ID!
      name: String!
      slug: String!
      description: String!
      price: Int!
      image: String
      stock: Int!
      category: String
    }

    type OrderItem {
      id: ID!
      quantity: Int!
      unitPrice: Int!
      product: Product!
    }

    type Order {
      id: ID!
      status: String!
      subtotal: Int!
      discount: Int!
      shipping: Int!
      total: Int!
      customerEmail: String!
      customerName: String
      createdAt: String!
      items: [OrderItem!]!
    }

    type Pricing {
      subtotal: Int!
      discount: Int!
      shipping: Int!
      total: Int!
    }

    input CartItemInput {
      productId: ID!
      quantity: Int!
    }

    type OrderResult {
      order: Order!
      pricing: Pricing!
    }

    type Query {
      products: [Product!]!
      orders(email: String!): [Order!]!
    }

    type Mutation {
      placeOrder(
        email: String!
        name: String
        items: [CartItemInput!]!
      ): OrderResult!
    }
  `,
  resolvers: {
    Query: {
      products: () => listProducts(),
      orders: async (_: unknown, { email }: { email: string }) =>
        getOrdersByEmail(email.toLowerCase()),
    },
    Mutation: {
      placeOrder: async (
        _: unknown,
        args: {
          email: string;
          name?: string | null;
          items: { productId: string; quantity: number }[];
        },
      ) => {
        const { order, pricing } = await createOrder({
          customerEmail: args.email.toLowerCase(),
          customerName: args.name ?? undefined,
          items: args.items,
        });

        return {
          order,
          pricing: {
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            shipping: pricing.shipping,
            total: pricing.total,
          },
        };
      },
    },
  },
});

const yogaApp = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
});

export const GET = (request: Request) => yogaApp(request);
export const POST = (request: Request) => yogaApp(request);
export const OPTIONS = (request: Request) => yogaApp(request);
