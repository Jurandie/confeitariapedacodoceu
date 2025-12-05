import { createSchema, createYoga } from "graphql-yoga";
import { prisma } from "@/lib/prisma";
import { createOrder, getOrdersByEmail } from "@/lib/server/orders";

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

    type Coupon {
      code: String!
      type: String!
      value: Int!
      minValue: Int
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
      coupon: Coupon
      items: [OrderItem!]!
    }

    type Pricing {
      subtotal: Int!
      discount: Int!
      shipping: Int!
      total: Int!
      couponCode: String
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
        couponCode: String
      ): OrderResult!
    }
  `,
  resolvers: {
    Query: {
      products: () => prisma.product.findMany({ orderBy: { name: "asc" } }),
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
          couponCode?: string | null;
        },
      ) => {
        const { order, pricing } = await createOrder({
          customerEmail: args.email.toLowerCase(),
          customerName: args.name ?? undefined,
          items: args.items,
          couponCode: args.couponCode ?? undefined,
        });

        return {
          order,
          pricing: {
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            shipping: pricing.shipping,
            total: pricing.total,
            couponCode: pricing.coupon?.code ?? null,
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
